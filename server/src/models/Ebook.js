const mongoose = require('mongoose');

/**
 * The e-book body of a product: chapters -> topics -> blocks.
 * Kept in its own collection so the public product API can never leak paid content.
 * Shape is validated/normalised by utils/ebook.js (sanitizeChapters) before every save.
 */
const ebookSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
    chapters: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true, minimize: false }
);

module.exports = mongoose.model('Ebook', ebookSchema);
