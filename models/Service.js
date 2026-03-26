const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  slug: { type: String, unique: true, lowercase: true, trim: true },
  image: { type: String, required: true },
  shortDescription: { type: String, required: true },
  longDescription: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

serviceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.isModified('heading')) {
    this.slug = this.heading.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
  }
  next();
});

module.exports = mongoose.model('Service', serviceSchema);
