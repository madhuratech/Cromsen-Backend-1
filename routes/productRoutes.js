const express = require('express');
const router = express.Namespace ? express.Router() : express.Router();
const productController = require('../controllers/productController');
const upload = require('../middleware/upload');

router.get('/', productController.getProducts);
router.get('/export', productController.exportProducts);
router.post('/import', productController.importProducts);
router.get('/search', productController.searchSuggestions);
router.get('/:id', productController.getProductById);
router.post('/', upload.single('image'), productController.createProduct);
router.put('/:id', upload.single('image'), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
