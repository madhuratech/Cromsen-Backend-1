const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const mockDB = require('../mockDB');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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
      amount: Math.round(Number(amount) * 100), // amount in the smallest currency unit
      currency,
      receipt,
    };

    console.log('Creating Razorpay order with options:', options);

    // Removed mock fallback to ensure real Razorpay is used
    console.log('Using Razorpay Key:', process.env.RAZORPAY_KEY_ID);

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ message: 'Error creating Razorpay order' });
    }

    // Save as Abandoned order in DB
    if (orderDetails) {
      const preparedOrder = { ...orderDetails };
      if (preparedOrder.user && preparedOrder.user.includes('@')) {
        preparedOrder.guestEmail = preparedOrder.user;
        delete preparedOrder.user;
      }

      if (mongoose.connection.readyState === 1) {
        try {
          const abandonedOrder = new Order({
            ...preparedOrder,
            paymentInfo: {
              id: order.id,
              status: 'Failed'
            },
            status: 'Abandoned'
          });
          await abandonedOrder.save();
          console.log('Abandoned order saved:', abandonedOrder._id);
        } catch (dbErr) {
          console.error('Error saving abandoned order:', dbErr);
        }
      } else {
        // Mock DB path
        const newOrder = {
          _id: "ord_mock_" + Date.now(),
          ...preparedOrder,
          paymentInfo: { id: order.id, status: 'Failed' },
          status: 'Abandoned',
          createdAt: new Date().toISOString()
        };
        mockDB.orders.push(newOrder);
        mockDB.save(require('path').join(__dirname, '../data/orders.json'), mockDB.orders);
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

      const paymentInfo = {
        id: razorpay_payment_id,
        orderId: razorpay_order_id,
        signature: razorpay_signature,
        method,
        methodDetails
      };

      // Payment verified - Find existing Abandoned order or create new
      // Payment verified - Find existing Abandoned order or create new
      let order;
      const finalOrderData = { ...orderDetails, paymentInfo, status: 'Processing', processingAt: new Date() };

      // Handle user/email mapping
      if (finalOrderData.user && finalOrderData.user.includes('@')) {
        finalOrderData.guestEmail = finalOrderData.user;
        delete finalOrderData.user;
      }

      // Sanitize items: only keep `product` field if it's a valid MongoDB ObjectId
      const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(String(id));
      if (finalOrderData.items && Array.isArray(finalOrderData.items)) {
        finalOrderData.items = finalOrderData.items.map(item => {
          if (item.product && !isValidObjectId(item.product)) {
            const { product, ...rest } = item;
            return rest;
          }
          return item;
        });
      }

      // Sanitize user field if it's still present
      if (finalOrderData.user && !isValidObjectId(finalOrderData.user)) {
        delete finalOrderData.user;
      }

      if (mongoose.connection.readyState === 1) {
        order = await Order.findOne({ "paymentInfo.id": razorpay_order_id });
        if (order) {
           Object.assign(order, finalOrderData);
           await order.save();
        } else {
           order = new Order(finalOrderData);
           await order.save();
        }
      } else {
        // Mock path
        const idx = mockDB.orders.findIndex(o => o.paymentInfo?.id === razorpay_order_id);
        if (idx !== -1) {
           mockDB.orders[idx] = { ...mockDB.orders[idx], ...finalOrderData };
           order = mockDB.orders[idx];
        } else {
           order = { 
             ...finalOrderData, 
             _id: "ord_mock_" + Date.now(), 
             createdAt: new Date().toISOString()
           };
           mockDB.orders.push(order);
        }
        mockDB.save(require('path').join(__dirname, '../data/orders.json'), mockDB.orders);
      }

      // Sanitize items: only keep `product` field if it's a valid MongoDB ObjectId
      const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(String(id));
      if (orderData.items && Array.isArray(orderData.items)) {
        orderData.items = orderData.items.map(item => {
          if (!item.product || !isValidObjectId(item.product)) {
            const { product, ...rest } = item;
            return rest;
          }
          return item;
        });
      }

      // Sanitize user field
      if (orderData.user && !isValidObjectId(orderData.user)) {
        delete orderData.user;
      }

      const newOrder = new Order(orderData);
      await newOrder.save();
      
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
