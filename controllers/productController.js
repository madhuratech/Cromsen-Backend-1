const Product = require('../models/Product');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const mockDB = require('../mockDB');
const path = require('path');

const populateMock = (products) => {
  return products.map(p => {
    const cat = mockDB.categories.find(c => c._id === p.category || c.name === p.category);
    return { ...p, category: cat || p.category, subCategory: p.subCategory };
  });
};

const enforcePricing = (product, role) => {
  const p = product.toObject ? product.toObject() : { ...product };
  // Admin and dealer see everything including wholesalePrice
  if (role === 'admin' || role === 'dealer') return p;
  // Regular customers: strip wholesale price
  const { wholesalePrice, ...customerView } = p;
  return customerView;
};

exports.getProducts = async (req, res) => {
  try {
    const { category, featured, search, page = 1, limit = 12 } = req.query;
    const role = req.headers['x-user-role'] || 'customer';
    const skip = (page - 1) * limit;

    if (mongoose.connection.readyState !== 1) {
      let results = [...mockDB.products];
      if (category) {
        let foundCatId = category;
        if (!mongoose.Types.ObjectId.isValid(category)) {
          const match = mockDB.categories.find(c => c.name.toLowerCase().replace(/[\s_]+/g, '-') === category);
          if (match) foundCatId = match._id || match.name;
        }
        results = results.filter(p => p.category === foundCatId || (p.category && p.category._id === foundCatId));
      }
      if (featured) results = results.filter(p => p.featured === (featured === 'true'));
      if (search) {
        const q = search.toLowerCase();
        results = results.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        );
      }
      const total = results.length;
      const paginatedResults = results.slice(skip, skip + Number(limit));
      const populated = populateMock(paginatedResults);
      const protectedResults = populated.map(p => enforcePricing(p, role));
      return res.json({
        products: protectedResults,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      });
    }

    let query = {};
    if (category) {
      const catArray = Array.isArray(category) ? category : category.split(',');
      const validCatIds = catArray.filter(c => mongoose.Types.ObjectId.isValid(c));
      
      if (validCatIds.length > 0) {
        query.category = { $in: validCatIds };
      } else {
        // Find by name slug if not valid IDs
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

    const products = await Product.find(query)
      .populate('category')
      .populate('subCategory')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

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

    if (mongoose.connection.readyState !== 1) {
      const suggestions = mockDB.products
        .filter(p => p.name.toLowerCase().includes(q.toLowerCase()))
        .map(p => p.name)
        .slice(0, 5);
      return res.json(suggestions);
    }

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

    if (mongoose.connection.readyState !== 1) {
      const product = mockDB.products.find(p => p._id === req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      const populated = populateMock([product])[0];
      return res.json(enforcePricing(populated, role));
    }

    const product = await Product.findById(req.params.id).populate('category').populate('subCategory');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(enforcePricing(product, role));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const newProduct = { ...req.body, _id: Date.now().toString() };
      mockDB.products.unshift(newProduct);
      mockDB.save(path.join(__dirname, '../data/products.json'), mockDB.products);
      return res.status(201).json(newProduct);
    }

    const productData = { ...req.body };
    if (req.file) productData.image = req.file.filename;

    // Parse JSON strings from FormData
    if (typeof productData.variants === 'string') {
      try { productData.variants = JSON.parse(productData.variants); } catch (e) {}
    }
    if (typeof productData.variantItems === 'string') {
      try { productData.variantItems = JSON.parse(productData.variantItems); } catch (e) {}
    }
    if (typeof productData.category === 'string') {
      if (productData.category.startsWith('[')) {
        try { productData.category = JSON.parse(productData.category); } catch (e) {}
      } else {
        productData.category = productData.category.split(',').filter(Boolean);
      }
    }

    const product = new Product(productData);
    const newProduct = await product.save();
    const populated = await newProduct.populate(['category', 'subCategory']);
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const index = mockDB.products.findIndex(p => p._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'Product not found' });
      mockDB.products[index] = { ...mockDB.products[index], ...req.body };
      mockDB.save(path.join(__dirname, '../data/products.json'), mockDB.products);
      return res.json(mockDB.products[index]);
    }

    const updateData = { ...req.body };
    if (req.file) updateData.image = req.file.filename;

    // Parse JSON strings from FormData
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

    // runValidators: false prevents required-field errors on partial updates
    // new: true returns the updated document
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

    if (mongoose.connection.readyState !== 1) {
      mockDB.products.forEach(p => {
        const idMatch = p._id || p.id;
        if (p.category === categoryId && !productIds.includes(idMatch)) {
          p.category = null;
        } else if (productIds.includes(idMatch)) {
          p.category = categoryId;
        }
      });
      mockDB.save(path.join(__dirname, '../data/products.json'), mockDB.products);
      return res.json({ success: true, message: 'Products reassigned' });
    }

    try {
      const categoryObjectId = new mongoose.Types.ObjectId(categoryId);
      
      // Unassign old products from this category
      await Product.updateMany({ category: categoryObjectId }, { $pull: { category: categoryObjectId } });
      
      // Add this category to the selected products
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
      console.error("Bulk update error:", err);
      res.status(500).json({ message: 'Error reassigning products: ' + err.message });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const index = mockDB.products.findIndex(p => p._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'Product not found' });
      mockDB.products.splice(index, 1);
      mockDB.save(path.join(__dirname, '../data/products.json'), mockDB.products);
      return res.json({ message: 'Product deleted' });
    }

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
      return res.status(400).json({ message: "Invalid data format. Expected an array of products." });
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
        console.error("Import error for one item:", err);
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