const Review = require('../models/Review');
const Product = require('../models/Product');

exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment, userName } = req.body;
    const userId = req.user ? req.user._id : null;

    const review = new Review({
      product: productId,
      user: userId,
      userName: userName || "Anonymous",
      rating,
      comment,
      status: 'pending' // Default status
    });

    await review.save();
    res.status(201).json({ message: 'Review submitted for moderation', review });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getApprovedReviewsByProduct = async (req, res) => {
  try {
    const reviews = await Review.find({ 
      product: req.params.productId, 
      status: 'approved' 
    }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('product', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json({ message: `Review ${status}`, review });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
