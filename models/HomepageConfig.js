const mongoose = require('mongoose');

const homepageConfigSchema = new mongoose.Schema({
  showHero: { type: Boolean, default: true },
  showCategories: { type: Boolean, default: true },
  showPopular: { type: Boolean, default: true },
  showFeatured: { type: Boolean, default: true },
  showCustomSection: { type: Boolean, default: false },

  // These should be arrays of ObjectIds for real DB, but we'll also support string IDs for mock mode
  popularProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  featuredProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  selectedCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],

  customSectionTitle: { type: String, default: "Our Collections" },
  customSectionProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
}, { timestamps: true });

module.exports = mongoose.model('HomepageConfig', homepageConfigSchema);
