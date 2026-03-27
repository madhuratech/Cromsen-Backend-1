const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const upload = require('../middleware/upload');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public: Get approved reviews for a product
router.get('/product/:productId', reviewController.getApprovedReviewsByProduct);

// Protected: Submit a review (Need login)
router.post('/', protect, upload.any(), reviewController.createReview);

// Admin: Get all reviews for moderation
router.get('/admin/all', protect, adminOnly, reviewController.getAllReviews);

// Admin: Approve/Reject a review
router.put('/admin/:id/status', protect, adminOnly, reviewController.updateReviewStatus);

// Admin: Delete a review
router.delete('/admin/:id', protect, adminOnly, reviewController.deleteReview);


module.exports = router;
