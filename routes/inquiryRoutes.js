const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiryController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Admin only: Get all inquiries
router.get('/', protect, adminOnly, inquiryController.getInquiries);

// Public: Create an inquiry
router.post('/', inquiryController.createInquiry);


module.exports = router;
