const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../middleware/upload');

router.get('/', productController.getProducts);
router.get('/export', productController.exportProducts);
router.post('/import', productController.importProducts);
router.get('/search', productController.searchSuggestions);
router.get('/:id', productController.getProductById);
router.post('/', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images', maxCount: 10 }]), productController.createProduct);
router.put('/bulk-category', productController.bulkUpdateCategory);
router.put('/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images', maxCount: 10 }]), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
