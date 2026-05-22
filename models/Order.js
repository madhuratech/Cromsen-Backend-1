const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  guestEmail: String,
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    quantity: Number,
    price: Number,
    variant: String,
    image: String,
    customColor: String,
    customDimensions: Object
  }],
  totalAmount: Number,
  shippingAddress: Object,
  paymentInfo: {
    id: String,
    status: String,
    method: String,
    methodDetails: Object
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
  refundTrackingAt: Date,
  refundProcessedAt: Date,
  refundCompletedAt: Date,
  replacementRequestedAt: Date,
  replacementProcessedAt: Date,
  replacementCompletedAt: Date,
  returnImages: [String],
  returnVideo: String,
  orderId: String,
  source: { type: String, default: 'web' },
  createdAt: { type: Date, default: Date.now }
});

orderSchema.pre('save', async function () {
  if (this.isNew && !this.orderId) {
    const src = (this.source || 'web').toLowerCase();
    const prefix = src === 'mobile' ? 'cim' : 'ciw';

    // Find the latest clean order ID for this specific prefix only
    const lastOrder = await this.constructor.findOne({
      orderId: { $regex: new RegExp(`^${prefix}-\\d+$`, 'i') }
    }).sort({ createdAt: -1 });

    let nextNumber = 1001;
    if (lastOrder && lastOrder.orderId) {
      // Safely extract only the trailing digits
      const match = lastOrder.orderId.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    this.orderId = `${prefix}-${nextNumber}`;
  }
});

module.exports = mongoose.model('Order', orderSchema);