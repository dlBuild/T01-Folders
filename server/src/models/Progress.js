const mongoose = require('mongoose');

// Per-user reading progress for one product: ticked tasks, quiz results, last topic opened.
const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    done: { type: [String], default: [] }, // ids of ticked task / activity blocks
    quiz: { type: mongoose.Schema.Types.Mixed, default: {} }, // { [blockId]: { chosen, correct } }
    lastTopic: { type: String, default: '' },
  },
  { timestamps: true, minimize: false }
);
progressSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
