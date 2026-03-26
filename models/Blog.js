const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, lowercase: true, trim: true },
  image: { type: String, required: true },
  shortDescription: { type: String },
  content: { type: String, required: true }, // Will store HTML string
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

blogSchema.pre('save', async function() {
  this.updatedAt = Date.now();
  if (this.isModified('title')) {
    this.slug = this.title.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
  }
  // Auto-generate shortDescription if empty
  if (!this.shortDescription && this.content) {
    // Strip HTML and take first 160 chars
    const plainText = this.content.replace(/<[^>]*>/g, '');
    this.shortDescription = plainText.length > 160 ? plainText.substring(0, 157) + '...' : plainText;
  }
});

module.exports = mongoose.model('Blog', blogSchema);
