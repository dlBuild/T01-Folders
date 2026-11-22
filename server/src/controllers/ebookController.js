const Ebook = require('../models/Ebook');
const Product = require('../models/Product');
const Access = require('../models/Access');
const Progress = require('../models/Progress');
const asyncHandler = require('../utils/asyncHandler');
const eb = require('../utils/ebook');

/* ------------------------------ Admin: build the e-book ------------------------------ */

exports.adminGet = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select('title slug');
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  const book = await Ebook.findOne({ product: product._id });
  res.json({ success: true, product, chapters: book?.chapters || [] });
});

exports.adminSave = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select('_id');
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  const chapters = eb.sanitizeChapters(req.body.chapters); // throws a clear 400 message for the admin
  const book = await Ebook.findOneAndUpdate(
    { product: product._id },
    { product: product._id, chapters },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ success: true, chapters: book.chapters, stats: eb.stats(book.chapters) });
});

/* ------------------------------ Product details: "What's inside" ------------------------------ */

// Titles only - never any of the lesson content.
exports.outline = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isPublished: true }).select('_id');
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  const book = await Ebook.findOne({ product: product._id });
  const chapters = book?.chapters || [];
  res.json({
    success: true,
    stats: eb.stats(chapters),
    chapters: chapters.map((c) => ({ id: c.id, title: c.title, topics: c.topics.map((t) => ({ id: t.id, title: t.title })) })),
  });
});

/* ------------------------------ Reader (needs purchase, or admin) ------------------------------ */

const loadForReader = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).select('title slug');
  if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return null; }
  const allowed = req.user.role === 'admin' || (await Access.exists({ user: req.user._id, product: product._id }));
  if (!allowed) { res.status(403).json({ success: false, message: 'Purchase this product to unlock it', code: 'NO_ACCESS' }); return null; }
  const book = await Ebook.findOne({ product: product._id });
  return { product, chapters: book?.chapters || [] };
};

exports.read = asyncHandler(async (req, res) => {
  const ctx = await loadForReader(req, res);
  if (!ctx) return;
  const prog = await Progress.findOne({ user: req.user._id, product: ctx.product._id });

  // Only quizzes that still exist; explanation is revealed only for a correct answer
  const quiz = {};
  eb.eachBlock(ctx.chapters, (b) => {
    const r = prog?.quiz?.[b.id];
    if (b.type === 'quiz' && r) quiz[b.id] = { chosen: r.chosen, correct: r.correct, explanation: r.correct ? b.explanation : undefined };
  });
  const ids = new Set(eb.trackableIds(ctx.chapters));
  const done = (prog?.done || []).filter((id) => ids.has(id));

  res.json({
    success: true,
    product: { id: ctx.product._id, title: ctx.product.title, slug: ctx.product.slug },
    chapters: eb.toReaderChapters(ctx.chapters),
    stats: eb.stats(ctx.chapters),
    progress: { done, quiz, lastTopic: prog?.lastTopic || '' },
  });
});

// Tick / untick a task or activity
exports.setTask = asyncHandler(async (req, res) => {
  const ctx = await loadForReader(req, res);
  if (!ctx) return;
  const block = eb.ID_RX.test(req.params.blockId) ? eb.findBlock(ctx.chapters, req.params.blockId) : null;
  if (!block || !['task', 'activity'].includes(block.type)) return res.status(404).json({ success: false, message: 'Task not found' });
  const op = req.body.done ? { $addToSet: { done: block.id } } : { $pull: { done: block.id } };
  await Progress.updateOne({ user: req.user._id, product: ctx.product._id }, op, { upsert: true });
  res.json({ success: true, done: !!req.body.done });
});

// Small test: the server checks the answer, so correct answers never reach the browser up front
exports.answerQuiz = asyncHandler(async (req, res) => {
  const ctx = await loadForReader(req, res);
  if (!ctx) return;
  const block = eb.ID_RX.test(req.params.blockId) ? eb.findBlock(ctx.chapters, req.params.blockId) : null;
  if (!block || block.type !== 'quiz') return res.status(404).json({ success: false, message: 'Question not found' });
  const choice = Number(req.body.choice);
  if (!Number.isInteger(choice) || choice < 0 || choice >= block.options.length) {
    return res.status(400).json({ success: false, message: 'Choose one of the options' });
  }
  const correct = choice === block.correct;
  await Progress.updateOne(
    { user: req.user._id, product: ctx.product._id },
    { $set: { [`quiz.${block.id}`]: { chosen: choice, correct } } },
    { upsert: true }
  );
  res.json({ success: true, correct, explanation: correct ? block.explanation : undefined });
});

exports.setPosition = asyncHandler(async (req, res) => {
  const ctx = await loadForReader(req, res);
  if (!ctx) return;
  const topicId = String(req.body.topicId || '');
  if (!eb.topicExists(ctx.chapters, topicId)) return res.status(400).json({ success: false, message: 'Unknown topic' });
  await Progress.updateOne({ user: req.user._id, product: ctx.product._id }, { $set: { lastTopic: topicId } }, { upsert: true });
  res.json({ success: true });
});
