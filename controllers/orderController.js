const Order = require('../models/Order');

exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('user')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);
    res.json({ orders, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const {
      status,
      expectedDelivery,
      cancelReason,
      replacementRequestedAt
    } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (expectedDelivery) updateData.expectedDelivery = expectedDelivery;
    if (cancelReason) updateData.cancelReason = cancelReason;
    if (replacementRequestedAt) updateData.replacementRequestedAt = replacementRequestedAt;

    if (req.files) {
      if (req.files.images && req.files.images.length > 0) {
        updateData.returnImages = req.files.images.map(f => f.path);
      }
      if (req.files.video && req.files.video.length > 0) {
        updateData.returnVideo = req.files.video[0].path;
      }
    }

    const now = new Date();
    const statusTimestamps = {
      'Processing':             { processingAt: now },
      'Shipped':                { shippedAt: now },
      'Out for Delivery':       { outForDeliveryAt: now },
      'Delivered':              { deliveredAt: now },
      'Cancelled':              { cancelledAt: now },
      'Refund Tracking':        { cancelledAt: now, refundTrackingAt: now },
      'Refund Initiated':       { refundInitiatedAt: now },
      'Refund Processed':       { refundProcessedAt: now },
      'Refund Completed':       { refundCompletedAt: now },
      'Replacement Requested':  { replacementRequestedAt: now },
      'Replacement Processed':  { replacementProcessedAt: now },
      'Replacement Completed':  { replacementCompletedAt: now },
    };

    if (status && statusTimestamps[status]) {
      Object.assign(updateData, statusTimestamps[status]);
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('user');

    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};