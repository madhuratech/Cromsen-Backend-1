const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../middleware/upload');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', productController.getProducts);
router.get('/search', productController.searchSuggestions);
router.get('/:id', productController.getProductById);

// Admin only routes
router.get('/export', protect, adminOnly, productController.exportProducts);
router.post('/import', protect, adminOnly, productController.importProducts);
router.post('/', protect, adminOnly, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images', maxCount: 10 }]), productController.createProduct);
router.put('/bulk-category', protect, adminOnly, productController.bulkUpdateCategory);
router.put('/:id', protect, adminOnly, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images', maxCount: 10 }]), productController.updateProduct);
router.delete('/:id', protect, adminOnly, productController.deleteProduct);


module.exports = router;
