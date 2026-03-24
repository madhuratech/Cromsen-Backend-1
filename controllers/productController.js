const Product = require('../models/Product');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const mockDB = require('../mockDB');
const path = require('path');

const slugify = (text) => {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
};

const populateMock = (products) => {
  return products.map(p => {
    const cat = mockDB.categories.find(c => c._id === p.category || c.name === p.category);
    const populated = { ...p, category: cat || p.category, subCategory: p.subCategory };
    if (!populated.slug && populated.name) populated.slug = slugify(populated.name);
    return populated;
  });
};

const enforcePricing = (product, role) => {
  const p = product.toObject ? product.toObject() : { ...product };

  // Helper to sanitize variant items
  if (p.variantItems && Array.isArray(p.variantItems)) {
    p.variantItems = p.variantItems.map(item => {
      const sanitized = { ...item };
      // Map the "active" price for this role to a generic .price field for simplicity
      if (role === 'admin' || role === 'dealer') {
        sanitized.price = item.wholesalePrice || item.retailPrice;
      } else {
        const { wholesalePrice, ...rest } = item;
        return { ...rest, price: item.retailPrice || item.price };
      }
      return sanitized;
    });
  }

  // Define product-level .price based on role
  p.price = (role === 'admin' || role === 'dealer') ? p.wholesalePrice : p.retailPrice;

  if (role === 'admin' || role === 'dealer') return p;
  
  // Regular customers: strip wholesale price
  const { wholesalePrice, ...customerView } = p;
  return customerView;
};

exports.getProducts = async (req, res) => {
  try {
    const { category, featured, search, page = 1, limit = 50, sort = 'newest' } = req.query;
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

      // Handle Mock Sorting
      if (sort === 'price-low') {
        results.sort((a, b) => (a.retailPrice || 0) - (b.retailPrice || 0));
      } else if (sort === 'price-high') {
        results.sort((a, b) => (b.retailPrice || 0) - (a.retailPrice || 0));
      } else if (sort === 'featured') {
        results.sort((a, b) => (b.featured === a.featured) ? 0 : b.featured ? 1 : -1);
      } else {
        // newest
        results.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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

    // Handle Mongo Sorting
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
      const product = mockDB.products.find(p => p._id === req.params.id || p.slug === req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      const populated = populateMock([product])[0];
      return res.json(enforcePricing(populated, role));
    }
    let product;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      product = await Product.findById(req.params.id).populate('category').populate('subCategory');
    } else {
      product = await Product.findOne({ slug: req.params.id }).populate('category').populate('subCategory');
    }

    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Auto-generate slug if missing for legacy products
    if (!product.slug && product.name) {
      product.slug = slugify(product.name);
      if (mongoose.connection.readyState === 1) {
        await Product.findByIdAndUpdate(product._id, { slug: product.slug });
      }
    }

    res.json(enforcePricing(product, role));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const newProduct = { ...req.body, _id: Date.now().toString() };
      if (!newProduct.slug && newProduct.name) newProduct.slug = slugify(newProduct.name);
      
      // Basic fields for mock mode - parse JSON string fields if they exist
      if (req.body.variants) newProduct.variants = JSON.parse(req.body.variants);
      if (req.body.variantItems) newProduct.variantItems = JSON.parse(req.body.variantItems);
      
      // Handle custom pricing fields for mock mode
      if (req.body.pricePerSqFtRetail) newProduct.pricePerSqFtRetail = req.body.pricePerSqFtRetail;
      if (req.body.pricePerSqFtDealer) newProduct.pricePerSqFtDealer = req.body.pricePerSqFtDealer;
      if (req.body.isCustomSizeEnabled !== undefined) {
        newProduct.isCustomSizeEnabled = req.body.isCustomSizeEnabled === 'true' || req.body.isCustomSizeEnabled === true;
      }

      // Handle images for mock mode
      if (req.files) {
        if (req.files.image && req.files.image.length > 0) newProduct.image = req.files.image[0].filename;
        if (req.files.images && req.files.images.length > 0) newProduct.images = req.files.images.map(f => f.filename);
      }

      mockDB.products.unshift(newProduct);
      mockDB.save(path.join(__dirname, '../data/products.json'), mockDB.products);
      return res.status(201).json(newProduct);
    }

    const productData = { ...req.body };
    
    // Explicitly cast numeric fields from FormData strings
    if (req.body.retailPrice) productData.retailPrice = Number(req.body.retailPrice);
    if (req.body.wholesalePrice) productData.wholesalePrice = Number(req.body.wholesalePrice);
    if (req.body.stock) productData.stock = Number(req.body.stock);
    if (req.body.pricePerSqFtRetail) productData.pricePerSqFtRetail = Number(req.body.pricePerSqFtRetail);
    if (req.body.pricePerSqFtDealer) productData.pricePerSqFtDealer = Number(req.body.pricePerSqFtDealer);

    if (req.files) {
      if (req.files.image && req.files.image.length > 0) {
        productData.image = req.files.image[0].filename;
      }
      if (req.files.images && req.files.images.length > 0) {
        productData.images = req.files.images.map(f => f.filename);
      }
    }
    
    // Standardize JSON parsing for complex fields
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
    console.error("Product creation error:", err);
    res.status(400).json({ 
      message: err.message,
      details: err.errors // Provide Mongoose validation details if available
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const index = mockDB.products.findIndex(p => p._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'Product not found' });
      
      const updateData = { ...req.body };
      if (updateData.name && !updateData.slug) updateData.slug = slugify(updateData.name);
      
      if (req.body.variants) updateData.variants = JSON.parse(req.body.variants);
      if (req.body.variantItems) updateData.variantItems = JSON.parse(req.body.variantItems);
      
      // Handle custom pricing fields for mock mode
      if (req.body.pricePerSqFtRetail) updateData.pricePerSqFtRetail = Number(req.body.pricePerSqFtRetail);
      if (req.body.pricePerSqFtDealer) updateData.pricePerSqFtDealer = Number(req.body.pricePerSqFtDealer);
      if (req.body.isCustomSizeEnabled !== undefined) {
        updateData.isCustomSizeEnabled = req.body.isCustomSizeEnabled === 'true' || req.body.isCustomSizeEnabled === true;
      }

      // Handle images for mock mode
      if (req.files) {
        if (req.files.image && req.files.image.length > 0) updateData.image = req.files.image[0].filename;
        if (req.files.images && req.files.images.length > 0) updateData.images = req.files.images.map(f => f.filename);
      }

      mockDB.products[index] = { ...mockDB.products[index], ...updateData };
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

    if (req.body.pricePerSqFtRetail !== undefined) {
      updateData.pricePerSqFtRetail = req.body.pricePerSqFtRetail === "" ? undefined : Number(req.body.pricePerSqFtRetail);
    }
    if (req.body.pricePerSqFtDealer !== undefined) {
      updateData.pricePerSqFtDealer = req.body.pricePerSqFtDealer === "" ? undefined : Number(req.body.pricePerSqFtDealer);
    }
    if (req.body.isCustomSizeEnabled !== undefined) {
      updateData.isCustomSizeEnabled = String(req.body.isCustomSizeEnabled) === 'true';
    }
    console.log('[Product Update] Payload:', updateData);

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