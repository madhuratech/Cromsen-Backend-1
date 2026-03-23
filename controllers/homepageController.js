const HomepageConfig = require('../models/HomepageConfig');
const mongoose = require('mongoose');
const mockDB = require('../mockDB');
const path = require('path');

// Helper to populate products in mock mode
const populateProducts = (ids) => {
  if (!ids || !Array.isArray(ids)) return [];
  return ids.map(id => {
    const product = mockDB.products.find(p => p._id === id || p.id === id);
    if (!product) return null;
    // Basic population (category name)
    const cat = mockDB.categories.find(c => c._id === product.category);
    return { ...product, category: cat || product.category };
  }).filter(Boolean);
};

// Helper to populate categories in mock mode
const populateCategories = (ids) => {
  if (!ids || !Array.isArray(ids)) return [];
  return ids.map(id => mockDB.categories.find(c => c._id === id)).filter(Boolean);
};

exports.getHomepageConfig = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Mock Mode
      const config = { ...mockDB.homepageConfig };
      
      // Populate sections for frontend consumption
      return res.json({
        ...config,
        popularProducts: populateProducts(config.popularProducts),
        featuredProducts: populateProducts(config.featuredProducts),
        selectedCategories: populateCategories(config.selectedCategories),
        customSectionProducts: populateProducts(config.customSectionProducts)
      });
    }

    // MongoDB Mode
    let config = await HomepageConfig.findOne();
    if (!config) {
      config = await HomepageConfig.create({});
    }

    // Populate the required fields
    const populatedConfig = await HomepageConfig.findById(config._id)
      .populate({ path: 'popularProducts', populate: { path: 'category' }})
      .populate({ path: 'featuredProducts', populate: { path: 'category' }})
      .populate('selectedCategories')
      .populate({ path: 'customSectionProducts', populate: { path: 'category' }});

    res.json(populatedConfig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateHomepageConfig = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Mock Mode update
      mockDB.homepageConfig = { ...mockDB.homepageConfig, ...req.body };
      mockDB.save(path.join(__dirname, '../data/homepageConfig.json'), mockDB.homepageConfig);
      return res.json(mockDB.homepageConfig);
    }

    // MongoDB Mode
    let config = await HomepageConfig.findOne();
    if (!config) {
      config = new HomepageConfig(req.body);
      await config.save();
    } else {
      config = await HomepageConfig.findByIdAndUpdate(config._id, req.body, { new: true });
    }

    res.json(config);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
