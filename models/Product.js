const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  slug: { type: String, unique: true, lowercase: true, trim: true },
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

const slugify = (text) => {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
};

productSchema.pre('save', async function(next) {
  if (this.isModified('name') || !this.slug) {
    let baseSlug = slugify(this.name);
    let finalSlug = baseSlug;
    let counter = 1;
    
    // Check for uniqueness for Mongo
    try {
      const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
      while (await Product.findOne({ slug: finalSlug, _id: { $ne: this._id } })) {
        finalSlug = `${baseSlug}-${counter++}`;
      }
      this.slug = finalSlug;
    } catch (e) {
      console.error("Slug generation error:", e);
    }
  }
  next();
});

// Adding virtuals for compatibility
productSchema.virtual('userPrice').get(function() { return this.retailPrice; });
productSchema.virtual('dealerPrice').get(function() { return this.wholesalePrice; });

module.exports = mongoose.model('Product', productSchema);

