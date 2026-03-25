const Product = require('../models/Product');
const Category = require('../models/Category');
const mongoose = require('mongoose');

const slugify = (text) => {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const enforcePricing = (product, role) => {
  const p = product.toObject ? product.toObject() : { ...product };

  if (p.variantItems && Array.isArray(p.variantItems)) {
    p.variantItems = p.variantItems.map(item => {
      const sanitized = { ...item };
      if (role === 'admin' || role === 'dealer') {
        sanitized.price = item.wholesalePrice || item.retailPrice;
      } else {
        const { wholesalePrice, ...rest } = item;
        return { ...rest, price: item.retailPrice || item.price };
      }
      return sanitized;
    });
  }

  p.price = (role === 'admin' || role === 'dealer') ? p.wholesalePrice : p.retailPrice;

  if (role === 'admin' || role === 'dealer') return p;

  const { wholesalePrice, ...customerView } = p;
  return customerView;
};

exports.getProducts = async (req, res) => {
  try {
    const { category, featured, search, page = 1, limit = 50, sort = 'newest' } = req.query;
    const role = req.headers['x-user-role'] || 'customer';
    const skip = (page - 1) * limit;

    let query = {};
    if (category) {
      const catArray = Array.isArray(category) ? category : category.split(',');
      const validCatIds = catArray.filter(c => mongoose.Types.ObjectId.isValid(c));

      if (validCatIds.length > 0) {
        query.category = { $in: validCatIds };
      } else {
        const allCats = await Category.find();
        const matches = allCats.filter(c => catArray.includes(c.name.toLowerCase().replace(/[\s_]+/g, '-')));
        if (matches.length > 0) {
          query.category = { $in: matches.map(m => m._id) };
        } else {
          query.category = { $in: [new mongoose.Types.ObjectId()] };
        }
      }
    }
    if (featured) query.featured = featured === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let sortQuery = { createdAt: -1 };
    if (sort === 'price-low') sortQuery = { retailPrice: 1 };
    if (sort === 'price-high') sortQuery = { retailPrice: -1 };
    if (sort === 'featured') sortQuery = { featured: -1, createdAt: -1 };

    const products = await Product.find(query)
      .populate('category')
      .populate('subCategory')
      .skip(skip)
      .limit(Number(limit))
      .sort(sortQuery);

    const total = await Product.countDocuments(query);
    const protectedProducts = products.map(p => enforcePricing(p, role));

    res.json({
      products: protectedProducts,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.searchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const products = await Product.find({
      name: { $regex: q, $options: 'i' }
    }).select('name').limit(5);

    res.json(products.map(p => p.name));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const role = req.headers['x-user-role'] || 'customer';

    let product;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      product = await Product.findById(req.params.id).populate('category').populate('subCategory');
    } else {
      product = await Product.findOne({ slug: req.params.id }).populate('category').populate('subCategory');
    }

    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (!product.slug && product.name) {
      product.slug = slugify(product.name);
      await Product.findByIdAndUpdate(product._id, { slug: product.slug });
    }

    res.json(enforcePricing(product, role));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    if (req.body.retailPrice) productData.retailPrice = Number(req.body.retailPrice);
    if (req.body.wholesalePrice) productData.wholesalePrice = Number(req.body.wholesalePrice);
    if (req.body.stock) productData.stock = Number(req.body.stock);
    if (req.body.pricePerSqFtRetail) productData.pricePerSqFtRetail = Number(req.body.pricePerSqFtRetail);
    if (req.body.pricePerSqFtDealer) productData.pricePerSqFtDealer = Number(req.body.pricePerSqFtDealer);

    if (req.files) {
      if (req.files.image && req.files.image.length > 0) {
        productData.image = req.files.image[0].path;
      }
      if (req.files.images && req.files.images.length > 0) {
        productData.images = req.files.images.map(f => f.path);
      }
    }

    const parseJSONField = (field) => {
      if (typeof field === 'string') {
        try { return JSON.parse(field); } catch (e) { return field; }
      }
      return field;
    };

    productData.variants = parseJSONField(req.body.variants);
    productData.variantItems = parseJSONField(req.body.variantItems);
    productData.category = parseJSONField(req.body.category);

    if (typeof productData.category === 'string' && !productData.category.startsWith('[')) {
      productData.category = productData.category.split(',').filter(Boolean);
    }

    const product = new Product(productData);
    const newProduct = await product.save();
    const populated = await newProduct.populate(['category', 'subCategory']);
    res.status(201).json(populated);
  } catch (err) {
    console.error('Product creation error:', err);
    res.status(400).json({
      message: err.message,
      details: err.errors
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.files) {
      if (req.files.image && req.files.image.length > 0) {
        updateData.image = req.files.image[0].path;
      }
      if (req.files.images && req.files.images.length > 0) {
        updateData.images = req.files.images.map(f => f.path);
      }
    }

    if (req.body.variants) updateData.variants = JSON.parse(req.body.variants);
    if (req.body.variantItems) updateData.variantItems = JSON.parse(req.body.variantItems);

    if (req.body.pricePerSqFtRetail !== undefined) {
      updateData.pricePerSqFtRetail = req.body.pricePerSqFtRetail === '' ? undefined : Number(req.body.pricePerSqFtRetail);
    }
    if (req.body.pricePerSqFtDealer !== undefined) {
      updateData.pricePerSqFtDealer = req.body.pricePerSqFtDealer === '' ? undefined : Number(req.body.pricePerSqFtDealer);
    }
    if (req.body.isCustomSizeEnabled !== undefined) {
      updateData.isCustomSizeEnabled = String(req.body.isCustomSizeEnabled) === 'true';
    }
    console.log('[Product Update] Payload:', updateData);

    if (typeof updateData.variants === 'string') {
      try { updateData.variants = JSON.parse(updateData.variants); } catch (e) {}
    }
    if (typeof updateData.variantItems === 'string') {
      try { updateData.variantItems = JSON.parse(updateData.variantItems); } catch (e) {}
    }
    if (typeof updateData.category === 'string') {
      if (updateData.category.startsWith('[')) {
        try { updateData.category = JSON.parse(updateData.category); } catch (e) {}
      } else {
        updateData.category = updateData.category.split(',').filter(Boolean);
      }
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: false }
    ).populate(['category', 'subCategory']);

    if (!updated) return res.status(404).json({ message: 'Product not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.bulkUpdateCategory = async (req, res) => {
  try {
    const { categoryId, productIds } = req.body;
    if (!categoryId || !Array.isArray(productIds)) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    const categoryObjectId = new mongoose.Types.ObjectId(categoryId);

    await Product.updateMany({ category: categoryObjectId }, { $pull: { category: categoryObjectId } });

    if (productIds && productIds.length > 0) {
      const productObjectIds = productIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));

      if (productObjectIds.length > 0) {
        await Product.updateMany({ _id: { $in: productObjectIds } }, { $addToSet: { category: categoryObjectId } });
      }
    }

    res.json({ success: true, message: 'Products reassigned' });
  } catch (err) {
    console.error('Bulk update error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.exportProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category').populate('subCategory');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.importProducts = async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ message: 'Invalid data format. Expected an array of products.' });
    }

    const results = { created: 0, updated: 0, errors: 0 };

    for (const prodData of products) {
      try {
        const { _id, ...cleanData } = prodData;
        let existing = null;
        if (cleanData.sku) {
          existing = await Product.findOne({ sku: cleanData.sku });
        }
        if (existing) {
          await Product.findByIdAndUpdate(existing._id, cleanData, { runValidators: false });
          results.updated++;
        } else {
          await Product.create(cleanData);
          results.created++;
        }
      } catch (err) {
        results.errors++;
        console.error('Import error for one item:', err);
      }
    }

    res.json({
      success: true,
      message: `Import completed. Created: ${results.created}, Updated: ${results.updated}, Errors: ${results.errors}`,
      results
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};