const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');

exports.getStats = async (req, res) => {
  try {
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
