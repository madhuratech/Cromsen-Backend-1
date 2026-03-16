const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SubCategory = require('../models/SubCategory');
const upload = require('../middleware/upload');
const mockDB = require('../mockDB');
const path = require('path');

// Get all subcategories
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Simple mock population
      const populated = mockDB.subCategories.map(s => {
        const cat = mockDB.categories.find(c => c._id === s.category || c.name === s.category);
        return { ...s, category: cat || s.category };
      });
      return res.json(populated);
    }
    const subCategories = await SubCategory.find().populate('category').sort({ createdAt: -1 });
    res.json(subCategories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create subcategory
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, category } = req.body;
    if (mongoose.connection.readyState !== 1) {
      const newSub = { 
        _id: Date.now().toString(), 
        name, 
        category,
        image: req.file ? req.file.filename : ""
      };
      mockDB.subCategories.push(newSub);
      mockDB.save(path.join(__dirname, '../data/subCategories.json'), mockDB.subCategories);
      return res.status(201).json(newSub);
    }
    const subCategory = await SubCategory.create({
      name,
      category,
      image: req.file ? req.file.filename : ""
    });
    res.status(201).json(await subCategory.populate('category'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update subcategory
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, category } = req.body;
    if (mongoose.connection.readyState !== 1) {
      const index = mockDB.subCategories.findIndex(s => s._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'Subcategory not found' });
      
      mockDB.subCategories[index] = { ...mockDB.subCategories[index], name, category };
      if (req.file) mockDB.subCategories[index].image = req.file.filename;
      
      mockDB.save(path.join(__dirname, '../data/subCategories.json'), mockDB.subCategories);
      return res.json(mockDB.subCategories[index]);
    }
    const updateData = { name, category };
    if (req.file) updateData.image = req.file.filename;
    
    const updated = await SubCategory.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('category');
    if (!updated) return res.status(404).json({ message: 'Subcategory not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete subcategory
router.delete('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const index = mockDB.subCategories.findIndex(s => s._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'Subcategory not found' });
      mockDB.subCategories.splice(index, 1);
      mockDB.save(path.join(__dirname, '../data/subCategories.json'), mockDB.subCategories);
      return res.json({ message: 'Subcategory deleted successfully' });
    }
    const deleted = await SubCategory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Subcategory not found' });
    res.json({ message: 'Subcategory deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
