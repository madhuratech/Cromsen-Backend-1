const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.getRazorpayKey = (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
};

exports.createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const options = {
      amount: Math.round(Number(amount) * 100), // amount in the smallest currency unit
      currency,
      receipt,
    };

    console.log('Creating Razorpay order with options:', options);

    // Fallback if Razorpay keys are missing (Mock Mode)
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('your-')) {
       return res.json({
         id: "order_mock_" + Date.now(),
         amount: options.amount,
         currency: options.currency,
         mock: true
       });
    }

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ message: 'Error creating Razorpay order' });
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
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || "mock_secret")
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign || razorpay_signature === "mock_signature") {
      // Fetch actual payment details from Razorpay to get the specific method (UPI, Card, etc.)
      let method = 'Razorpay';
      let methodDetails = {};

      try {
        if (!razorpay_payment_id.startsWith('pay_mock')) {
          const payment = await razorpay.payments.fetch(razorpay_payment_id);
          method = payment.method; // 'card', 'netbanking', 'wallet', 'upi'
          methodDetails = {
            card: payment.card,
            bank: payment.bank,
            wallet: payment.wallet,
            vpa: payment.vpa, // for UPI
            email: payment.email,
            contact: payment.contact
          };
        }
      } catch (err) {
        console.error('Error fetching Razorpay payment details:', err);
      }

      // Payment verified
      const orderData = {
        ...orderDetails,
        paymentInfo: {
          id: razorpay_payment_id,
          status: 'Paid',
          method: method,
          methodDetails: methodDetails
        },
        status: 'Processing',
        processingAt: new Date()
      };

      // Handle Guest checkout vs Logged in user
      if (orderDetails.user && orderDetails.user.includes('@')) {
        orderData.guestEmail = orderDetails.user;
        delete orderData.user;
      }

      const newOrder = new Order(orderData);
      await newOrder.save();
      
      return res.status(200).json({ 
        message: 'Payment verified successfully',
        orderId: newOrder._id
      });
    } else {
      return res.status(400).json({ message: 'Invalid signature sent!' });
    }
  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({ message: error.message });
  }
};
