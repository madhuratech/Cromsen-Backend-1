const Review = require('../models/Review');
const Product = require('../models/Product');

exports.createReview = async (req, res) => {
  try {
    console.log('[Review Request] Headers:', req.headers);
    console.log('[Review Request] Body:', req.body);
    console.log('[Review Request] Files:', req.files);
    
    const body = req.body || {};
    const { productId, rating, comment, userName } = body;
    
    if (!productId) {
      return res.status(400).json({ 
        message: 'Missing product information. Our system couldn\'t parse your review correctly.',
        debug: { hasBody: !!req.body, hasFiles: !!req.files }
      });
    }

    const userId = req.user ? req.user._id : null;

    let images = [];
    let videos = [];

    if (Array.isArray(req.files)) {
      images = req.files.filter(f => f.fieldname === 'images').map(f => f.filename);
      videos = req.files.filter(f => f.fieldname === 'videos').map(f => f.filename);
    } else if (req.files) {
      if (req.files.images) images = req.files.images.map(f => f.filename);
      if (req.files.videos) videos = req.files.videos.map(f => f.filename);
    }

    const review = new Review({
      product: productId,
      user: userId,
      userName: userName || "Anonymous",
      rating: Number(rating),
      comment,
      images,
      videos,
      status: 'pending' 
    });

    await review.save();
    res.status(201).json({ message: 'Review submitted for moderation', review });
  } catch (err) {
    console.error('[Create Review] error:', err);
    res.status(400).json({ message: 'Submission failed. Please check file sizes and formats.', error: err.message });
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
