const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  retailPrice: { type: Number, required: true }, // Same as userPrice
  wholesalePrice: { type: Number, required: true }, // Same as dealerPrice
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' },
  variants: [{
    name: String,
    options: [String]
  }],
  variantItems: [{
    combination: String,
    price: Number,
    stock: Number,
    image: String
  }],
  image: { type: String, default: "" }, // Singular image from combined backend
  images: [{ type: String }], // Array for multiple images
  stock: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Adding virtuals for compatibility
productSchema.virtual('userPrice').get(function() { return this.retailPrice; });
productSchema.virtual('dealerPrice').get(function() { return this.wholesalePrice; });

module.exports = mongoose.model('Product', productSchema);
