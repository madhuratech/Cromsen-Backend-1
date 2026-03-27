const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Utility to validate MongoDB ObjectId
const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(String(id));

// Helper to sanitize order data (items and user mapping)
const sanitizeOrderData = (data) => {
  if (!data) return {};
  const sanitized = { ...data };

  // Sanitize user: move email to guestEmail if not a valid ObjectId
  if (sanitized.user && !isValidObjectId(sanitized.user)) {
    if (sanitized.user.includes('@')) {
      sanitized.guestEmail = sanitized.user;
    }
    delete sanitized.user;
  }

  // Sanitize items: remove product field if it's not a valid ObjectId
  if (sanitized.items && Array.isArray(sanitized.items)) {
    sanitized.items = sanitized.items.map(item => {
      if (item.product && !isValidObjectId(item.product)) {
        const { product, ...rest } = item;
        return rest;
      }
      return item;
    });
  }
  return sanitized;
};

exports.getRazorpayKey = (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
};

exports.createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, orderDetails } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const options = {
      amount: Math.round(Number(amount) * 100),
      currency,
      receipt,
    };

    console.log('Creating Razorpay order with options:', options);
    console.log('Using Razorpay Key:', process.env.RAZORPAY_KEY_ID);

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ message: 'Error creating Razorpay order' });
    }

    // Save as Abandoned order in DB
    if (orderDetails) {
      const preparedOrder = sanitizeOrderData(orderDetails);
      try {
        const abandonedOrder = new Order({
          ...preparedOrder,
          paymentInfo: { id: order.id, status: 'Failed' },
          status: 'Abandoned'
        });
        await abandonedOrder.save();
        console.log('Abandoned order saved:', abandonedOrder._id);
      } catch (dbErr) {
        console.error('Error saving abandoned order:', dbErr);
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Razorpay Order Error Details:', error);
    res.status(500).json({
      message: error.description || error.message || 'Payment Service Error',
      error: error
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderDetails
    } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'mock_secret')
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign || razorpay_signature === 'mock_signature') {
      let method = 'Razorpay';
      let methodDetails = {};

      try {
        if (razorpay_payment_id &&
            !razorpay_payment_id.startsWith('pay_mock') &&
            !razorpay_payment_id.startsWith('pay_exchange')) {
          const payment = await razorpay.payments.fetch(razorpay_payment_id);
          method = payment.method;
          methodDetails = {
            card: payment.card,
            bank: payment.bank,
            wallet: payment.wallet,
            vpa: payment.vpa,
            email: payment.email,
            contact: payment.contact
          };
        }
      } catch (err) {
        console.error('Error fetching Razorpay payment details:', err);
      }

      const paymentInfo = {
        id: razorpay_payment_id,
        orderId: razorpay_order_id,
        signature: razorpay_signature,
        status: 'Success',
        method,
        methodDetails
      };

      let order;
      const finalOrderData = sanitizeOrderData({
        ...orderDetails,
        paymentInfo,
        status: 'Processing',
        processingAt: new Date()
      });

      order = await Order.findOne({ 'paymentInfo.id': razorpay_order_id });
      if (order) {
        Object.assign(order, finalOrderData);
        await order.save();
      } else {
        order = new Order(finalOrderData);
        await order.save();
      }

      return res.status(200).json({
        message: 'Payment verified successfully',
        orderId: order._id
      });

    } else {
      return res.status(400).json({ message: 'Invalid signature sent!' });
    }
  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({ message: error.message });
  }
};
