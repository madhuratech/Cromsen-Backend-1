const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const upload = require('../middleware/upload');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', categoryController.getCategories);

// Admin only: Create, update, delete categories
router.post('/', protect, adminOnly, upload.single('image'), categoryController.createCategory);
router.put('/:id', protect, adminOnly, upload.single('image'), categoryController.updateCategory);
router.delete('/:id', protect, adminOnly, categoryController.deleteCategory);


module.exports = router;