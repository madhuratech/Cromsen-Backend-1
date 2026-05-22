const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const upload = require('../middleware/upload');

router.get('/', orderController.getOrders);
router.put('/:id', upload.fields([{ name: 'images', maxCount: 3 }, { name: 'video', maxCount: 1 }]), orderController.updateOrderStatus);
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
