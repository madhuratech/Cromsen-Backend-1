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
  returnImages: [String],
  returnVideo: String,
  orderId: String,
  source: { type: String, default: 'web' },
  createdAt: { type: Date, default: Date.now }
});

orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderId) {
    try {
      // Find the last order that has a properly formatted orderId (e.g. ciw-1001)
      const lastOrder = await this.constructor.findOne({ orderId: { $regex: /^(ciw|cim)-\d+$/ } })
        .sort({ _id: -1 });

      let nextNumber = 1001;
      if (lastOrder && lastOrder.orderId) {
        const parts = lastOrder.orderId.split('-');
        if (parts.length > 1) {
          const num = parseInt(parts[1], 10);
          if (!isNaN(num)) {
            nextNumber = num + 1;
          }
        }
      }

      const src = this.source || 'web';
      const prefix = src.toLowerCase() === 'mobile' ? 'cim' : 'ciw';
      this.orderId = `${prefix}-${nextNumber}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
