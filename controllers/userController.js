const User = require('../models/User');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const mockDB = require('../mockDB');
const path = require('path');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role = 'customer' } = req.body;
    
    if (mongoose.connection.readyState !== 1) {
      const newUser = { _id: Date.now().toString(), name, email, role };
      mockDB.users.push(newUser);
      mockDB.save(path.join(__dirname, '../data/users.json'), mockDB.users);
      return res.status(201).json({ ...newUser, token: generateToken(newUser._id) });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, role });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password, requiredRole } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const user = mockDB.users.find(u => u.email === email);
      if (user) {
        if (requiredRole && user.role !== requiredRole) {
           return res.status(401).json({ message: `Access denied. Please login via the correct portal.` });
        }
        return res.json({ ...user, token: generateToken(user._id) });
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      // Role enforcement check
      if (requiredRole && user.role !== requiredRole) {
        // Special case: admin can login anywhere if needed? Usually admin has its own login.
        // For now, strict match as requested.
        return res.status(401).json({ message: `Access denied. Please login via the correct portal.` });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    if (mongoose.connection.readyState !== 1) {
      const results = mockDB.users.slice(skip, skip + Number(limit));
      return res.json({ users: results, total: mockDB.users.length });
    }
    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
      
    const total = await User.countDocuments();
    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (mongoose.connection.readyState !== 1) {
      const index = mockDB.users.findIndex(u => u._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'User not found' });
      mockDB.users[index].role = role;
      mockDB.save(path.join(__dirname, '../data/users.json'), mockDB.users);
      return res.json(mockDB.users[index]);
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const index = mockDB.users.findIndex(u => u._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'User not found' });
      mockDB.users.splice(index, 1);
      mockDB.save(path.join(__dirname, '../data/users.json'), mockDB.users);
      return res.json({ message: 'User deleted' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const user = mockDB.users.find(u => u._id === req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      user.isBlocked = !user.isBlocked;
      mockDB.save(path.join(__dirname, '../data/users.json'), mockDB.users);
      return res.json({ success: true, isBlocked: user.isBlocked });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ success: true, isBlocked: user.isBlocked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
