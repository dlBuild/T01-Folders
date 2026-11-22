/**
 * E-book content helpers: validation / normalisation of what the admin saves,
 * video-link handling, link safety and statistics.
 * Content is rendered as plain text by the client (never as raw HTML), so there is no XSS surface here;
 * we still validate every URL so nobody can store javascript: links.
 */
const crypto = require('crypto');

const LIMITS = { chapters: 60, topics: 40, blocks: 80, title: 160, summary: 600, text: 20000, option: 300, options: 6 };
const ID_RX = /^[a-f0-9]{12}$/;
const TRACKABLE = new Set(['task', 'activity', 'quiz']);

const bad = (message) => Object.assign(new Error(message), { statusCode: 400 });
const str = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : '');

/** Internal path ("/explore/some-book") or http(s) URL. Anything else is rejected. */
function cleanHref(value, where) {
  const v = str(value, 2000);
  if (!v) throw bad(`${where}: link is empty`);
  if (v.startsWith('/') && !v.startsWith('//') && !/[\\\s]/.test(v)) return v;
  try {
    const u = new URL(v);
    if (u.protocol === 'https:' || u.protocol === 'http:') return u.toString();
  } catch { /* fall through */ }
  throw bad(`${where}: link must start with https:// (or / for a page on this site)`);
}

/** YouTube / Vimeo page links become safe embed URLs; direct https video files are played natively. */
function parseVideo(value, where) {
  const raw = str(value, 2000);
  if (!raw) return null;
  let u;
  try { u = new URL(raw); } catch { throw bad(`${where}: video link is not a valid URL`); }
  const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
  const yt = (id) => (/^[A-Za-z0-9_-]{11}$/.test(id || '') ? { kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${id}` } : null);

  if (host === 'youtu.be') { const r = yt(u.pathname.slice(1)); if (r) return r; }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const parts = u.pathname.split('/').filter(Boolean);
    const id = u.searchParams.get('v') || (['embed', 'shorts', 'live'].includes(parts[0]) ? parts[1] : '');
    const r = yt(id); if (r) return r;
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = u.pathname.split('/').filter(Boolean).find((p) => /^\d+$/.test(p));
    if (id) return { kind: 'embed', src: `https://player.vimeo.com/video/${id}` };
  }
  if (u.protocol === 'https:' && /\.(mp4|webm|ogg)$/i.test(u.pathname)) return { kind: 'file', src: u.toString() };
  throw bad(`${where}: use a YouTube or Vimeo link, or a direct https link to an .mp4/.webm file`);
}

function sanitizeChapters(input) {
  if (!Array.isArray(input)) throw bad('Chapters must be a list');
  if (input.length > LIMITS.chapters) throw bad(`Maximum ${LIMITS.chapters} chapters`);
  const used = new Set();
  const id = (given) => {
    let v = typeof given === 'string' && ID_RX.test(given) && !used.has(given) ? given : '';
    while (!v || used.has(v)) v = crypto.randomBytes(6).toString('hex');
    used.add(v);
    return v;
  };

  return input.map((c, ci) => {
    const cw = `Chapter ${ci + 1}`;
    const title = str(c?.title, LIMITS.title);
    if (!title) throw bad(`${cw} needs a title`);
    const topicsIn = Array.isArray(c.topics) ? c.topics : [];
    if (topicsIn.length > LIMITS.topics) throw bad(`${cw}: maximum ${LIMITS.topics} topics`);

    return {
      id: id(c.id),
      title,
      summary: str(c.summary, LIMITS.summary),
      video: parseVideo(c.video?.url ?? c.video?.src ?? c.videoUrl ?? '', `${cw} video`),
      topics: topicsIn.map((t, ti) => {
        const tw = `${cw}, topic ${ti + 1}`;
        const tt = str(t?.title, LIMITS.title);
        if (!tt) throw bad(`${tw} needs a title`);
        const blocksIn = Array.isArray(t.blocks) ? t.blocks : [];
        if (blocksIn.length > LIMITS.blocks) throw bad(`${tw}: maximum ${LIMITS.blocks} blocks`);
        return {
          id: id(t.id),
          title: tt,
          video: parseVideo(t.video?.url ?? t.video?.src ?? t.videoUrl ?? '', `${tw} video`),
          blocks: blocksIn.map((b, bi) => sanitizeBlock(b, `${tw}, block ${bi + 1}`, id)),
        };
      }),
    };
  });
}

function sanitizeBlock(b, where, id) {
  const type = b?.type;
  const base = { id: id(b?.id), type };
  switch (type) {
    case 'text': {
      const body = str(b.body, LIMITS.text);
      if (!body) throw bad(`${where}: text is empty`);
      return { ...base, body };
    }
    case 'video': {
      const video = parseVideo(b.video?.url ?? b.video?.src ?? b.url ?? '', `${where} video`);
      if (!video) throw bad(`${where}: add a video link`);
      return { ...base, title: str(b.title, LIMITS.title), video };
    }
    case 'task': {
      const label = str(b.label, 400);
      if (!label) throw bad(`${where}: task text is empty`);
      return { ...base, label };
    }
    case 'activity': {
      const title = str(b.title, LIMITS.title);
      if (!title) throw bad(`${where}: activity needs a title`);
      return { ...base, title, body: str(b.body, LIMITS.text) };
    }
    case 'quiz': {
      const question = str(b.question, 500);
      const options = (Array.isArray(b.options) ? b.options : []).map((o) => str(o, LIMITS.option)).filter(Boolean);
      const correct = Number(b.correct);
      if (!question) throw bad(`${where}: question is empty`);
      if (options.length < 2 || options.length > LIMITS.options) throw bad(`${where}: a question needs 2 to ${LIMITS.options} options`);
      if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) throw bad(`${where}: choose the correct option`);
      return { ...base, question, options, correct, explanation: str(b.explanation, 1000) };
    }
    case 'link': {
      const label = str(b.label, 200);
      if (!label) throw bad(`${where}: link needs a label`);
      return { ...base, label, href: cleanHref(b.href, `${where} link`) };
    }
    default:
      throw bad(`${where}: unknown block type`);
  }
}

/** Walk every block: (chapter, topic, block) => void */
function eachBlock(chapters, fn) {
  for (const c of chapters || []) for (const t of c.topics || []) for (const b of t.blocks || []) fn(b, t, c);
}

const trackableIds = (chapters) => {
  const ids = [];
  eachBlock(chapters, (b) => { if (TRACKABLE.has(b.type)) ids.push(b.id); });
  return ids;
};

function stats(chapters) {
  const s = { chapters: (chapters || []).length, topics: 0, videos: 0, tasks: 0, quizzes: 0, trackable: 0 };
  for (const c of chapters || []) { if (c.video) s.videos++; s.topics += (c.topics || []).length; for (const t of c.topics || []) if (t.video) s.videos++; }
  eachBlock(chapters, (b) => {
    if (b.type === 'video') s.videos++;
    if (b.type === 'task' || b.type === 'activity') s.tasks++;
    if (b.type === 'quiz') s.quizzes++;
    if (TRACKABLE.has(b.type)) s.trackable++;
  });
  return s;
}

/** Client copy of the book: quiz answers and explanations are never sent in the content itself. */
const toReaderChapters = (chapters) =>
  chapters.map((c) => ({
    ...c,
    topics: c.topics.map((t) => ({
      ...t,
      blocks: t.blocks.map((b) => (b.type === 'quiz' ? { id: b.id, type: 'quiz', question: b.question, options: b.options } : b)),
    })),
  }));

const findBlock = (chapters, blockId) => {
  let found = null;
  eachBlock(chapters, (b) => { if (b.id === blockId) found = b; });
  return found;
};

const topicExists = (chapters, topicId) => (chapters || []).some((c) => (c.topics || []).some((t) => t.id === topicId));

module.exports = { sanitizeChapters, stats, trackableIds, toReaderChapters, findBlock, topicExists, eachBlock, cleanHref, parseVideo, ID_RX };
