const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const mongoose = require('mongoose');
const mockDB = require('../mockDB');

exports.getStats = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        totalProducts: mockDB.products.length,
        totalCategories: mockDB.categories.length,
        totalOrders: mockDB.orders.length,
        totalUsers: mockDB.users.length
      });
    }

    const [totalProducts, totalCategories, totalOrders, totalUsers] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Order.countDocuments(),
      User.countDocuments()
    ]);

    res.json({
      totalProducts,
      totalCategories,
      totalOrders,
      totalUsers
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
