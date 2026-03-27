const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Store-wide order management (Admin only)
router.get('/', protect, adminOnly, orderController.getOrders);
router.put('/:id', protect, adminOnly, orderController.updateOrderStatus);
router.delete('/:id', protect, adminOnly, orderController.deleteOrder);


module.exports = router;
