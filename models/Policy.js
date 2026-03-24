const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, lowercase: true, trim: true },
  content: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

policySchema.pre('save', async function() {
  this.updatedAt = Date.now();
  if (this.isModified('title')) {
    this.slug = this.title.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
  }
});

module.exports = mongoose.model('Policy', policySchema);
