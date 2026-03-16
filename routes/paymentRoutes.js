const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getRazorpayKey } = require('../controllers/paymentController');

router.get('/get-key', getRazorpayKey);
router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);

module.exports = router;
