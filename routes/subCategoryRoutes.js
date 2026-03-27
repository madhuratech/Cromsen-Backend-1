const express = require('express');
const router = express.Router();
const SubCategory = require('../models/SubCategory');
const upload = require('../middleware/upload');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Get all subcategories (Public)
router.get('/', async (req, res) => {

  try {
    const subCategories = await SubCategory.find().populate('category').sort({ createdAt: -1 });
    res.json(subCategories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create subcategory (Admin only)
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {

  try {
    const { name, category } = req.body;
    const subCategory = await SubCategory.create({
      name,
      category,
      image: req.file ? req.file.path : ''
    });
    res.status(201).json(await subCategory.populate('category'));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update subcategory (Admin only)
router.put('/:id', protect, adminOnly, upload.single('image'), async (req, res) => {

  try {
    const { name, category } = req.body;
    const updateData = { name, category };
    if (req.file) updateData.image = req.file.path;

    const updated = await SubCategory.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('category');
    if (!updated) return res.status(404).json({ message: 'Subcategory not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete subcategory (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {

  try {
    const deleted = await SubCategory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Subcategory not found' });
    res.json({ message: 'Subcategory deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
