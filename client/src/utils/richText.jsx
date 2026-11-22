import { Link } from 'react-router-dom';

/**
 * Tiny, safe formatter for e-book text (no raw HTML is ever injected):
 *   ## Heading   ### Sub-heading   - bullet   1. numbered   > note
 *   **bold**   *italic*   `code`   [link text](https://... or /explore/slug)
 */
const isSafeHref = (h) => (h.startsWith('/') && !h.startsWith('//')) || /^https?:\/\//i.test(h);

function inline(text, keyBase) {
  const out = [];
  const rx = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = rx.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith('**')) out.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={key} className="bg-navy-800/10 rounded px-1.5 py-0.5 text-[0.9em]">{tok.slice(1, -1)}</code>);
    else if (tok.startsWith('[')) {
      const [, label, href] = tok.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      if (!isSafeHref(href)) out.push(label);
      else if (href.startsWith('/')) out.push(<Link key={key} to={href} className="text-sky-brand font-semibold underline">{label}</Link>);
      else out.push(<a key={key} href={href} target="_blank" rel="noopener noreferrer nofollow" className="text-sky-brand font-semibold underline">{label}</a>);
    } else out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function RichText({ text }) {
  const lines = (text || '').split('\n');
  const nodes = [];
  let para = [];
  let list = null; // { ordered, items }
  let k = 0;

  const flushPara = () => { if (para.length) { nodes.push(<p key={k++} className="leading-relaxed">{inline(para.join(' '), `p${k}`)}</p>); para = []; } };
  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? 'ol' : 'ul';
    nodes.push(
      <Tag key={k++} className={`${list.ordered ? 'list-decimal' : 'list-disc'} pl-6 space-y-1.5`}>
        {list.items.map((it, i) => <li key={i}>{inline(it, `l${k}-${i}`)}</li>)}
      </Tag>
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { flushPara(); flushList(); continue; }
    if ((m = line.match(/^###\s+(.*)/))) { flushPara(); flushList(); nodes.push(<h4 key={k++} className="text-lg font-extrabold mt-2">{inline(m[1], `h${k}`)}</h4>); continue; }
    if ((m = line.match(/^##\s+(.*)/))) { flushPara(); flushList(); nodes.push(<h3 key={k++} className="text-xl font-extrabold mt-3">{inline(m[1], `h${k}`)}</h3>); continue; }
    if ((m = line.match(/^>\s?(.*)/))) { flushPara(); flushList(); nodes.push(<blockquote key={k++} className="border-l-4 border-amber bg-amber/10 rounded-r-lg px-4 py-3">{inline(m[1], `q${k}`)}</blockquote>); continue; }
    if ((m = line.match(/^[-*]\s+(.*)/))) { flushPara(); if (!list || list.ordered) { flushList(); list = { ordered: false, items: [] }; } list.items.push(m[1]); continue; }
    if ((m = line.match(/^\d+[.)]\s+(.*)/))) { flushPara(); if (!list || !list.ordered) { flushList(); list = { ordered: true, items: [] }; } list.items.push(m[1]); continue; }
    flushList();
    para.push(line.trim());
  }
  flushPara();
  flushList();
  return <div className="space-y-4 text-navy-800/90">{nodes}</div>;
}
