const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  guestEmail: String,
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    quantity: Number,
    price: Number,
    variant: String
  }],
  totalAmount: Number,
  shippingAddress: Object,
  paymentInfo: {
    id: String,
    status: String,
    method: String,
    methodDetails: Object // To store card/upi info
  },
  status: { type: String, default: 'Pending' },
  processingAt: Date,
  shippedAt: Date,
  outForDeliveryAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancelReason: String,
  expectedDelivery: Date,
  refundInitiatedAt: Date,
  refundProcessedAt: Date,
  refundCompletedAt: Date,
  replacementRequestedAt: Date,
  replacementProcessedAt: Date,
  replacementCompletedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
