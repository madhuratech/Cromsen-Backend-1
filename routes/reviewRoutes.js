const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// In a real app, you'd add middleware to get req.user from token
// For now, we'll keep it simple as requested

// Public: Get approved reviews for a product
router.get('/product/:productId', reviewController.getApprovedReviewsByProduct);

// Public: Submit a review
router.post('/', reviewController.createReview);

// Admin: Get all reviews for moderation
router.get('/admin/all', reviewController.getAllReviews);

// Admin: Approve/Reject a review
router.put('/admin/:id/status', reviewController.updateReviewStatus);

// Admin: Delete a review
router.delete('/admin/:id', reviewController.deleteReview);

module.exports = router;
