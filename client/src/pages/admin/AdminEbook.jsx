import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowDown, FiArrowUp, FiPlus, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import Spinner from '../../components/Spinner';
import { errMsg } from '../../utils/format';

/* Editor <-> server shape. The editor keeps video links as plain "videoUrl" strings. */
const vurl = (v) => v?.src || '';
const toEditor = (chapters) => chapters.map((c) => ({
  ...c, videoUrl: vurl(c.video),
  topics: c.topics.map((t) => ({
    ...t, videoUrl: vurl(t.video),
    blocks: t.blocks.map((b) => (b.type === 'video' ? { ...b, videoUrl: vurl(b.video) } : b)),
  })),
}));
const fromEditor = (chapters) => chapters.map((c) => ({
  id: c.id, title: c.title, summary: c.summary, video: { url: c.videoUrl || '' },
  topics: c.topics.map((t) => ({
    id: t.id, title: t.title, video: { url: t.videoUrl || '' },
    blocks: t.blocks.map((b) => (b.type === 'video' ? { id: b.id, type: 'video', title: b.title, video: { url: b.videoUrl || '' } } : b)),
  })),
}));

const NEW_BLOCK = {
  text: () => ({ type: 'text', body: '' }),
  video: () => ({ type: 'video', title: '', videoUrl: '' }),
  task: () => ({ type: 'task', label: '' }),
  activity: () => ({ type: 'activity', title: '', body: '' }),
  quiz: () => ({ type: 'quiz', question: '', options: ['', ''], correct: 0, explanation: '' }),
  link: () => ({ type: 'link', label: '', href: '' }),
};
const BLOCK_LABEL = { text: 'Text', video: 'Video', task: 'Task (tick box)', activity: 'Activity', quiz: 'Quick test', link: 'Link' };

const move = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };

const Field = ({ label, children }) => <div><label className="label !text-xs">{label}</label>{children}</div>;
const IconBtn = ({ onClick, title, children, danger }) => (
  <button type="button" title={title} aria-label={title} onClick={onClick} className={`p-1.5 rounded-md hover:bg-navy-800/10 ${danger ? 'text-red-600' : 'text-navy-800/70'}`}>{children}</button>
);

function BlockEditor({ b, set, onUp, onDown, onDelete }) {
  return (
    <div className="rounded-xl border border-navy-800/15 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="badge bg-sky-soft text-navy-800">{BLOCK_LABEL[b.type]}</span>
        <div className="flex"><IconBtn title="Move up" onClick={onUp}><FiArrowUp /></IconBtn><IconBtn title="Move down" onClick={onDown}><FiArrowDown /></IconBtn><IconBtn title="Delete block" danger onClick={onDelete}><FiTrash2 /></IconBtn></div>
      </div>

      {b.type === 'text' && (
        <Field label="Text (## Heading, - bullets, 1. numbered, > note, **bold**, [link text](https://... or /explore/other-book))">
          <textarea className="input font-mono" rows={8} value={b.body} onChange={(e) => set({ body: e.target.value })} />
        </Field>
      )}
      {b.type === 'video' && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Caption (optional)"><input className="input" value={b.title} onChange={(e) => set({ title: e.target.value })} /></Field>
          <Field label="YouTube / Vimeo link, or https link to .mp4"><input className="input" value={b.videoUrl} onChange={(e) => set({ videoUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." /></Field>
        </div>
      )}
      {b.type === 'task' && <Field label="Task the reader ticks off"><input className="input" value={b.label} onChange={(e) => set({ label: e.target.value })} placeholder="e.g. Update your LinkedIn headline" /></Field>}
      {b.type === 'activity' && (
        <div className="space-y-3">
          <Field label="Activity title"><input className="input" value={b.title} onChange={(e) => set({ title: e.target.value })} /></Field>
          <Field label="Instructions"><textarea className="input" rows={4} value={b.body} onChange={(e) => set({ body: e.target.value })} /></Field>
        </div>
      )}
      {b.type === 'quiz' && (
        <div className="space-y-3">
          <Field label="Question"><input className="input" value={b.question} onChange={(e) => set({ question: e.target.value })} /></Field>
          <div className="space-y-2">
            {b.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" title="Correct answer" checked={b.correct === i} onChange={() => set({ correct: i })} className="accent-green-700" />
                <input className="input" value={o} placeholder={`Option ${i + 1}`} onChange={(e) => set({ options: b.options.map((x, j) => (j === i ? e.target.value : x)) })} />
                {b.options.length > 2 && <IconBtn title="Remove option" danger onClick={() => set({ options: b.options.filter((_, j) => j !== i), correct: b.correct === i ? 0 : b.correct > i ? b.correct - 1 : b.correct })}><FiTrash2 /></IconBtn>}
              </div>
            ))}
            {b.options.length < 6 && <button type="button" className="text-xs font-bold text-sky-brand" onClick={() => set({ options: [...b.options, ''] })}>+ Add option</button>}
            <p className="text-xs text-navy-800/50">Select the circle next to the correct answer.</p>
          </div>
          <Field label="Explanation (shown after a correct answer)"><input className="input" value={b.explanation} onChange={(e) => set({ explanation: e.target.value })} /></Field>
        </div>
      )}
      {b.type === 'link' && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Link text"><input className="input" value={b.label} onChange={(e) => set({ label: e.target.value })} /></Field>
          <Field label="Link (https://... or /explore/product-slug)"><input className="input" value={b.href} onChange={(e) => set({ href: e.target.value })} /></Field>
        </div>
      )}
    </div>
  );
}

export default function AdminEbook() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [chapters, setChapters] = useState(null);
  const [open, setOpen] = useState(0); // which chapter is expanded
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminAPI.getEbook(id).then((r) => { setProduct(r.data.product); setChapters(toEditor(r.data.chapters)); }).catch((e) => { toast.error(errMsg(e)); setChapters([]); });
  }, [id]);

  useEffect(() => {
    const warn = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const mutate = (fn) => { setChapters((cs) => { const n = structuredClone(cs); fn(n); return n; }); setDirty(true); };

  const save = async () => {
    setBusy(true);
    try {
      const { data } = await adminAPI.saveEbook(id, fromEditor(chapters));
      setChapters(toEditor(data.chapters)); // picks up the ids the server assigned
      setDirty(false);
      toast.success('E-book saved');
    } catch (e) { toast.error(errMsg(e, 'Could not save')); } finally { setBusy(false); }
  };

  if (chapters === null) return <Spinner />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <Link to="/admin/products" className="text-sm font-bold text-sky-brand">← Products</Link>
          <h2 className="text-2xl font-extrabold">E-book content{product ? `: ${product.title}` : ''}</h2>
        </div>
        <div className="flex gap-3">
          {product && <Link to={`/learn/${product.slug}`} target="_blank" className="btn-outline-dark">Preview as reader</Link>}
          <button className="btn-primary" disabled={busy || !dirty} onClick={save}>{busy ? 'Saving...' : dirty ? 'Save changes' : 'Saved'}</button>
        </div>
      </div>
      <p className="text-sm text-navy-800/70 mb-6">Build the e-book like a web page: chapters contain topics, topics contain text, videos, tasks, activities, quick tests and links. Readers only see it after they buy the product.</p>

      <div className="space-y-4">
        {chapters.map((c, ci) => (
          <div key={c.id || `new-${ci}`} className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <button type="button" className="font-extrabold text-left flex-1" onClick={() => setOpen(open === ci ? -1 : ci)}>Chapter {ci + 1}: {c.title || <span className="text-navy-800/40">(untitled)</span>}</button>
              <div className="flex">
                <IconBtn title="Move chapter up" onClick={() => mutate((n) => move(n, ci, -1))}><FiArrowUp /></IconBtn>
                <IconBtn title="Move chapter down" onClick={() => mutate((n) => move(n, ci, 1))}><FiArrowDown /></IconBtn>
                <IconBtn title="Delete chapter" danger onClick={() => window.confirm('Delete this chapter and everything in it?') && mutate((n) => n.splice(ci, 1))}><FiTrash2 /></IconBtn>
              </div>
            </div>

            {open === ci && (
              <div className="mt-4 space-y-5">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Chapter title"><input className="input" value={c.title} onChange={(e) => mutate((n) => { n[ci].title = e.target.value; })} /></Field>
                  <Field label="Chapter video (optional)"><input className="input" value={c.videoUrl} placeholder="YouTube / Vimeo / .mp4 link" onChange={(e) => mutate((n) => { n[ci].videoUrl = e.target.value; })} /></Field>
                </div>
                <Field label="Short summary (optional)"><textarea className="input" rows={2} value={c.summary} onChange={(e) => mutate((n) => { n[ci].summary = e.target.value; })} /></Field>

                {c.topics.map((t, ti) => (
                  <div key={t.id || `new-${ci}-${ti}`} className="rounded-2xl bg-cream p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-sm">Topic {ti + 1}</p>
                      <div className="flex">
                        <IconBtn title="Move topic up" onClick={() => mutate((n) => move(n[ci].topics, ti, -1))}><FiArrowUp /></IconBtn>
                        <IconBtn title="Move topic down" onClick={() => mutate((n) => move(n[ci].topics, ti, 1))}><FiArrowDown /></IconBtn>
                        <IconBtn title="Delete topic" danger onClick={() => window.confirm('Delete this topic?') && mutate((n) => n[ci].topics.splice(ti, 1))}><FiTrash2 /></IconBtn>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Topic title"><input className="input" value={t.title} onChange={(e) => mutate((n) => { n[ci].topics[ti].title = e.target.value; })} /></Field>
                      <Field label="Explanation video for this topic (optional)"><input className="input" value={t.videoUrl} placeholder="YouTube / Vimeo / .mp4 link" onChange={(e) => mutate((n) => { n[ci].topics[ti].videoUrl = e.target.value; })} /></Field>
                    </div>

                    {t.blocks.map((b, bi) => (
                      <BlockEditor
                        key={b.id || `new-${ci}-${ti}-${bi}`} b={b}
                        set={(patch) => mutate((n) => { Object.assign(n[ci].topics[ti].blocks[bi], patch); })}
                        onUp={() => mutate((n) => move(n[ci].topics[ti].blocks, bi, -1))}
                        onDown={() => mutate((n) => move(n[ci].topics[ti].blocks, bi, 1))}
                        onDelete={() => mutate((n) => n[ci].topics[ti].blocks.splice(bi, 1))}
                      />
                    ))}

                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs font-bold text-navy-800/60 mr-1">Add:</span>
                      {Object.keys(NEW_BLOCK).map((type) => (
                        <button key={type} type="button" className="px-3 py-1.5 rounded-full bg-white text-xs font-bold hover:bg-sky-soft" onClick={() => mutate((n) => n[ci].topics[ti].blocks.push(NEW_BLOCK[type]()))}>+ {BLOCK_LABEL[type]}</button>
                      ))}
                    </div>
                  </div>
                ))}

                <button type="button" className="btn-outline-dark" onClick={() => mutate((n) => n[ci].topics.push({ title: '', videoUrl: '', blocks: [] }))}><FiPlus /> Add topic</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button type="button" className="btn-dark mt-5" onClick={() => { mutate((n) => n.push({ title: '', summary: '', videoUrl: '', topics: [] })); setOpen(chapters.length); }}><FiPlus /> Add chapter</button>
    </div>
  );
}
