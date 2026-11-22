/** npm run seed  ->  creates the admin account, sample products and default landing content (safe to re-run). */
const env = require('../config/env');
const connectDB = require('../config/db');
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Content = require('../models/Content');
const Ebook = require('../models/Ebook');
const { sanitizeChapters } = require('./ebook');
const defaults = require('../services/defaultContent');

const products = [
  {
    title: 'Career Roadmap Starter Pack', slug: 'career-roadmap-starter-pack', category: 'roadmap', price: 199, compareAtPrice: 499, isFeatured: true,
    tagline: 'Know which career paths exist and what to learn first.',
    description: 'A structured set of career roadmaps for popular entry-level roles, with skills, learning order, projects and timelines.',
    features: ['10+ role-based roadmaps', 'Skills checklist per role', 'Suggested learning order', 'Project ideas for your portfolio'],
  },
  {
    title: 'Job-Role Learning Guide', slug: 'job-role-learning-guide', category: 'guide', price: 149, compareAtPrice: 299, isFeatured: true,
    tagline: 'Everything you need to become job-ready for one role.',
    description: 'Deep-dive guide for a single job role: tools, concepts, practice tasks and how recruiters evaluate candidates.',
    features: ['Skills and tools breakdown', 'Practice tasks', 'Resume tips for the role'],
  },
  {
    title: 'Interview Preparation Kit (Free)', slug: 'interview-preparation-kit-free', category: 'interview', price: 0, isFeatured: true,
    tagline: 'Free resources to prepare for your first interviews.',
    description: 'Common questions, answering frameworks and a self-evaluation sheet to practise before real interviews.',
    features: ['Common HR and technical questions', 'Answer frameworks', 'Self-evaluation sheet'],
  },
  {
    title: 'Career Planning Workbook', slug: 'career-planning-workbook', category: 'planning', price: 99,
    tagline: 'Plan the next 12 months with clarity.',
    description: 'A printable workbook to map interests, strengths, goals and a monthly action plan.',
    features: ['Self-assessment exercises', '12-month action planner', 'Goal tracking templates'],
  },
];

const sampleBook = (title) => [
  {
    title: 'Start here',
    summary: `Welcome to ${title}. This short chapter shows how the e-book works.`,
    topics: [
      {
        title: 'How to use this e-book',
        blocks: [
          { type: 'text', body: '## Welcome\nEach chapter has **topics**. Read them in order, or jump to any topic from the contents on the left.\n- Tick the tasks as you finish them\n- Try the small tests at the end of a topic\n- Prefer watching? Look for the video in a topic' },
          { type: 'task', label: 'Read this page to the end' },
          { type: 'activity', title: 'Your first activity', body: 'Write down, in one sentence, the career you are most curious about right now. You will come back to it at the end.' },
          { type: 'quiz', question: 'Where do your ticked tasks get saved?', options: ['Only in this browser tab', 'In your account, so you can continue later', 'Nowhere'], correct: 1, explanation: 'Progress is saved to your account, on any device.' },
        ],
      },
    ],
  },
];

(async () => {
  await connectDB();

  let admin = await User.findOne({ email: env.admin.email.toLowerCase() });
  if (!admin) {
    admin = await User.create({ name: env.admin.name, email: env.admin.email, phone: env.admin.phone, password: env.admin.password, role: 'admin' });
    console.log(`Admin created: ${admin.email}  (change the password after first login)`);
  } else console.log(`Admin exists: ${admin.email}`);

  for (const p of products) {
    let product = await Product.findOne({ slug: p.slug });
    if (!product) product = await Product.create({ ...p, deliveryType: 'ebook' });
    // Sample e-book so the reader can be tried straight away. Edit it in Admin -> Products -> E-book content.
    if (!(await Ebook.exists({ product: product._id }))) {
      await Ebook.create({ product: product._id, chapters: sanitizeChapters(sampleBook(p.title)) });
    }
  }
  console.log(`Products ready: ${await Product.countDocuments()}`);

  await Content.updateOne({ key: 'home' }, { $setOnInsert: { key: 'home', data: defaults } }, { upsert: true });
  console.log('Landing content ready');

  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
