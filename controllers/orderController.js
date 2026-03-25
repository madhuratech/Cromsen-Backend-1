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
    const { status, expectedDelivery, cancelReason, replacementRequestedAt } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (expectedDelivery) updateData.expectedDelivery = expectedDelivery;
    if (cancelReason) updateData.cancelReason = cancelReason;
    if (replacementRequestedAt) updateData.replacementRequestedAt = replacementRequestedAt;

    if (status === 'Processing') updateData.processingAt = new Date();
    if (status === 'Shipped') updateData.shippedAt = new Date();
    if (status === 'Out for Delivery') updateData.outForDeliveryAt = new Date();
    if (status === 'Delivered') updateData.deliveredAt = new Date();
    if (status === 'Cancelled' || status === 'Refund Tracking') updateData.cancelledAt = new Date();
    if (status === 'Refund Tracking') updateData.refundTrackingAt = new Date();
    if (status === 'Refund Completed') updateData.refundCompletedAt = new Date();
    if (status === 'Replacement Requested') updateData.replacementRequestedAt = new Date();
    if (status === 'Replacement Processed') updateData.replacementProcessedAt = new Date();
    if (status === 'Replacement Completed') updateData.replacementCompletedAt = new Date();

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('user');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
