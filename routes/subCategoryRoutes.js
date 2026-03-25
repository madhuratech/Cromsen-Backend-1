const express = require('express');
const router = express.Router();
const SubCategory = require('../models/SubCategory');
const upload = require('../middleware/upload');

// Get all subcategories
router.get('/', async (req, res) => {
  try {
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
    const subCategory = await SubCategory.create({
      name,
      category,
      image: req.file ? req.file.filename : ''
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
    const deleted = await SubCategory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Subcategory not found' });
    res.json({ message: 'Subcategory deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
