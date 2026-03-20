const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  retailPrice: { type: Number, required: true }, 
  wholesalePrice: { type: Number, required: true }, 
   category: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' },
  image: { type: String, default: "" }, 
  images: [{ type: String }], 
  variants: [
    {
      name: { type: String }, // e.g. "Color", "Size", "Thickness"
      options: [{ type: String }] // e.g. ["Red", "Blue"]
    }
  ],
  variantItems: [
    {
      combination: { type: String }, // e.g. "Red / 2.18MM"
      retailPrice: { type: Number },
      wholesalePrice: { type: Number },
      stock: { type: Number, default: 0 }
    }
  ],
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

