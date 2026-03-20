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
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        const allCats = await Category.find();
        const match = allCats.find(c => c.name.toLowerCase().replace(/[\s_]+/g, '-') === category);
        if (match) {
          query.category = match._id;
        } else {
          query.category = new mongoose.Types.ObjectId(); // invalid ID to return no products
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
    if (req.files) {
      if (req.files.image && req.files.image.length > 0) {
        productData.image = req.files.image[0].filename;
      }
      if (req.files.images && req.files.images.length > 0) {
        productData.images = req.files.images.map(f => f.filename);
      }
    }
    
    if (req.body.variants) productData.variants = JSON.parse(req.body.variants);
    if (req.body.variantItems) productData.variantItems = JSON.parse(req.body.variantItems);

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
    if (req.files) {
      if (req.files.image && req.files.image.length > 0) {
        updateData.image = req.files.image[0].filename;
      }
      if (req.files.images && req.files.images.length > 0) {
        updateData.images = req.files.images.map(f => f.filename);
      }
    }

    if (req.body.variants) updateData.variants = JSON.parse(req.body.variants);
    if (req.body.variantItems) updateData.variantItems = JSON.parse(req.body.variantItems);

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

    // Unassign old products from this category
    await Product.updateMany({ category: categoryId }, { $unset: { category: 1 } });
    if (productIds.length > 0) {
      // Assign selected products to this category
      await Product.updateMany({ _id: { $in: productIds } }, { category: categoryId });
    }
    
    res.json({ success: true, message: 'Products reassigned' });
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