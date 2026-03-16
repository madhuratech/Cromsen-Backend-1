const Order = require('../models/Order');
const mongoose = require('mongoose');
const mockDB = require('../mockDB');
const path = require('path');

exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    if (mongoose.connection.readyState !== 1) {
      let results = [...mockDB.orders];
      if (status) results = results.filter(o => o.status === status);
      
      const paginated = results.slice(skip, skip + Number(limit)).map(order => {
        const user = mockDB.users.find(u => u._id === order.user);
        return { ...order, user };
      });
      return res.json({ orders: paginated, total: results.length });
    }

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
    const { status } = req.body;
    if (mongoose.connection.readyState !== 1) {
      const index = mockDB.orders.findIndex(o => o._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'Order not found' });
      mockDB.orders[index].status = status;
      mockDB.save(path.join(__dirname, '../data/orders.json'), mockDB.orders);
      return res.json(mockDB.orders[index]);
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('user');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const index = mockDB.orders.findIndex(o => o._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'Order not found' });
      mockDB.orders.splice(index, 1);
      mockDB.save(path.join(__dirname, '../data/orders.json'), mockDB.orders);
      return res.json({ message: 'Order deleted' });
    }
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
