const Category = require('../models/Category');
const mongoose = require('mongoose');
const mockDB = require('../mockDB');

exports.getCategories = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(mockDB.categories);
    }
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const newCat = { ...req.body, _id: Date.now().toString() };
      if (req.file) newCat.image = req.file.path;
      mockDB.categories.push(newCat);
      mockDB.save(require('path').join(__dirname, '../data/categories.json'), mockDB.categories);
      return res.status(201).json(newCat);
    }
    const { name, description } = req.body;
    const categoryData = { name, description };
    if (req.file) categoryData.image = req.file.path;

    const category = new Category(categoryData);
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const index = mockDB.categories.findIndex(c => c._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'Category not found' });
      const updated = { ...mockDB.categories[index], ...req.body };
      if (req.file) updated.image = req.file.path;
      mockDB.categories[index] = updated;
      mockDB.save(require('path').join(__dirname, '../data/categories.json'), mockDB.categories);
      return res.json(mockDB.categories[index]);
    }

    // Fetch the existing document first to preserve the image if not re-uploaded
    const existing = await Category.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Category not found' });

    const { name, description, existingImage } = req.body;
    const updateData = {
      name,
      description,
      // Priority: new uploaded file → existingImage sent from frontend → existing DB value
      image: req.file ? req.file.path : (existingImage || existing.image || ""),
    };

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const index = mockDB.categories.findIndex(c => c._id === req.params.id || c.name === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'Category not found' });
      mockDB.categories.splice(index, 1);
      mockDB.save(require('path').join(__dirname, '../data/categories.json'), mockDB.categories);
      return res.json({ message: 'Category deleted' });
    }
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};