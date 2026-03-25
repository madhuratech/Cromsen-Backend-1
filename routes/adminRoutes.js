const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username and password required' });

    const admin = await Admin.findOne({ username: { $regex: new RegExp(`^${username.trim()}$`, 'i') } });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({
      success: true,
      username: admin.username,
      role: admin.role,
      _id: admin._id,
      token: 'mock-jwt-token'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin Stats
router.get('/stats', async (req, res) => {
  try {
    const [totalProducts, totalCategories, totalOrders, totalUsers, recentOrders, lowStock, revenueData, refundData] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Order.countDocuments(),
      User.countDocuments(),
      Order.find().populate('user').sort({ createdAt: -1 }).limit(5),
      Product.find({ stock: { $lt: 10 } }).limit(5),
      Order.aggregate([
        { $match: { status: { $nin: ['Cancelled', 'Abandoned'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { status: 'Refunded' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;
    const totalRefunds = refundData.length > 0 ? refundData[0].total : 0;

    res.json({
      totalProducts,
      totalCategories,
      totalOrders,
      totalUsers,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalProfit: Math.round(totalRevenue * 0.25 * 100) / 100,
      totalRefunds: Math.round(totalRefunds * 100) / 100,
      recentOrders,
      lowStock
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin Profile management (Username/Password)
router.put('/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const admin = await Admin.findOne({ username: username.trim() });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    admin.password = newPassword;
    await admin.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/change-username', async (req, res) => {
  try {
    const { currentUsername, newUsername } = req.body;
    const trimmed = newUsername.trim();

    const existing = await Admin.findOne({ username: trimmed });
    if (existing) return res.status(409).json({ message: 'Username already taken' });

    const admin = await Admin.findOne({ username: currentUsername.trim() });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    admin.username = trimmed;
    await admin.save();
    res.json({ success: true, username: trimmed, message: 'Username updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────
// Sub-admin management
// ─────────────────────────────────────────────

// GET all sub-admins
router.get('/subadmins', async (req, res) => {
  try {
    const subAdmins = await Admin.find({ role: 'sub' }).select('-password').sort({ createdAt: -1 });
    res.json(subAdmins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create sub-admin
router.post('/subadmins', async (req, res) => {
  try {
    const { username, password } = req.body;
    const trimmed = username.trim().toLowerCase();

    const existing = await Admin.findOne({ username: trimmed });
    if (existing) return res.status(409).json({ message: 'Username already exists' });

    const newSubAdmin = await Admin.create({ username: trimmed, password, role: 'sub' });

    const safeSubAdmin = newSubAdmin.toObject();
    delete safeSubAdmin.password;
    res.status(201).json(safeSubAdmin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update sub-admin (username and/or password)
router.put('/subadmins/:id', async (req, res) => {
  try {
    const { username, password } = req.body;
    const { id } = req.params;

    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ message: 'Sub-admin not found' });
    if (admin.role === 'main') return res.status(403).json({ message: 'Cannot edit the main admin via this route' });

    if (username) {
      const trimmed = username.trim().toLowerCase();
      const conflict = await Admin.findOne({ username: trimmed, _id: { $ne: id } });
      if (conflict) return res.status(409).json({ message: 'Username already taken' });
      admin.username = trimmed;
    }

    if (password && password.trim()) {
      admin.password = password.trim();
    }

    await admin.save();

    const safeAdmin = admin.toObject();
    delete safeAdmin.password;
    res.json(safeAdmin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE sub-admin
router.delete('/subadmins/:id', async (req, res) => {
  try {
    const adminToDelete = await Admin.findById(req.params.id);
    if (!adminToDelete) return res.status(404).json({ message: 'Sub admin not found' });
    if (adminToDelete.role === 'main') return res.status(403).json({ message: 'Cannot delete the main admin' });

    await Admin.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Sub admin deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;