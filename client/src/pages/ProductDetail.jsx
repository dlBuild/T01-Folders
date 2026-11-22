import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiCheck, FiPlayCircle, FiCheckSquare, FiHelpCircle, FiBookOpen } from 'react-icons/fi';
import { productAPI, libraryAPI } from '../services/api';
import Spinner from '../components/Spinner';
import { inr, categoryLabel } from '../utils/format';

const Stat = ({ icon, value, label }) => value > 0 && (
  <div className="card px-4 py-3 flex items-center gap-3">
    <span className="text-sky-brand">{icon}</span>
    <div><p className="font-extrabold leading-none">{value}</p><p className="text-xs text-navy-800/60">{label}</p></div>
  </div>
);

/** Product Details -> Buy Now (this page is behind login, see ProtectedRoute in App.jsx) */
export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [outline, setOutline] = useState(null);
  const [owned, setOwned] = useState(false);

  useEffect(() => {
    setP(null); setOutline(null);
    productAPI.get(slug).then((r) => setP(r.data.product)).catch(() => setP(false));
    productAPI.outline(slug).then((r) => setOutline(r.data)).catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!p) return;
    libraryAPI.list().then((r) => setOwned(r.data.items.some((i) => i.product._id === p._id))).catch(() => {});
  }, [p]);

  if (p === null) return <Spinner full />;
  if (p === false) return <div className="container-t01 py-24 text-center">Product not found. <Link className="underline" to="/explore">Back to Explore</Link></div>;

  const s = outline?.stats;

  return (
    <div className="container-t01 py-12 grid lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2">
        <Link to="/explore" className="text-sm font-bold text-sky-brand">← All products</Link>
        <span className="badge bg-mint ml-3">{categoryLabel(p.category)}</span>
        <h1 className="text-3xl md:text-4xl font-extrabold mt-3">{p.title}</h1>
        <p className="text-lg text-navy-800/70 mt-2">{p.tagline}</p>

        <div className="mt-6 rounded-2xl overflow-hidden bg-sky-soft h-64 flex items-center justify-center">
          {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="h-full w-full object-cover" /> : <span className="text-7xl font-extrabold text-navy-800/15">T01<span className="text-amber">.</span></span>}
        </div>

        {s && s.chapters > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <Stat icon={<FiBookOpen />} value={s.chapters} label="chapters" />
            <Stat icon={<FiPlayCircle />} value={s.videos} label="videos" />
            <Stat icon={<FiCheckSquare />} value={s.tasks} label="tasks & activities" />
            <Stat icon={<FiHelpCircle />} value={s.quizzes} label="quick tests" />
          </div>
        )}

        <h2 className="text-xl font-extrabold mt-8 mb-2">About this e-book</h2>
        <p className="whitespace-pre-line text-navy-800/80 leading-relaxed">{p.description}</p>

        {p.features?.length > 0 && (
          <>
            <h2 className="text-xl font-extrabold mt-8 mb-3">What you get</h2>
            <ul className="space-y-2">{p.features.map((f) => <li key={f} className="flex gap-3"><FiCheck className="text-green-700 mt-1 shrink-0" />{f}</li>)}</ul>
          </>
        )}

        {outline?.chapters?.length > 0 && (
          <>
            <h2 className="text-xl font-extrabold mt-8 mb-3">What is inside</h2>
            <div className="space-y-3">
              {outline.chapters.map((c, i) => (
                <details key={c.id} className="card p-4 group" open={i === 0}>
                  <summary className="font-extrabold cursor-pointer list-none flex justify-between gap-4">
                    <span>Chapter {i + 1}: {c.title}</span><span className="text-navy-800/40 group-open:rotate-180 transition">⌄</span>
                  </summary>
                  <ul className="mt-3 space-y-1.5 text-sm text-navy-800/80 list-disc pl-5">{c.topics.map((t) => <li key={t.id}>{t.title}</li>)}</ul>
                </details>
              ))}
            </div>
          </>
        )}
      </div>

      <aside className="lg:sticky lg:top-24 h-fit card p-6">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-extrabold">{inr(p.price)}</span>
          {p.compareAtPrice > p.price && <span className="line-through text-navy-800/40">₹{p.compareAtPrice}</span>}
        </div>
        {owned ? (
          <Link to={`/learn/${p.slug}`} className="btn-dark w-full mt-5">Open my e-book</Link>
        ) : (
          <button onClick={() => navigate(`/checkout/${p.slug}`)} className="btn-primary w-full mt-5">{p.price === 0 ? 'Get it free' : 'Buy Now'}</button>
        )}
        <ul className="text-sm text-navy-800/70 mt-5 space-y-2">
          <li>✓ Read online - chapters, topics and explanation videos</li>
          <li>✓ Tick off tasks and track your progress</li>
          <li>✓ Instant access after payment</li>
          <li>✓ Pay via UPI, card or net banking - secured by Cashfree</li>
        </ul>
      </aside>
    </div>
  );
}
