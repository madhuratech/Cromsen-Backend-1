const User = require('../models/User');
const mongoose = require('mongoose');

// Helper to get user by email (common in this app's auth style)
const getUserByEmail = async (email) => {
  return await User.findOne({ email });
};

exports.getAddresses = async (req, res) => {
  try {
    const { email } = req.query;
    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.addresses || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const { email, address } = req.body;
    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (address.isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }
    
    user.addresses.push(address);
    if (user.addresses.length === 1) user.addresses[0].isDefault = true;
    
    await user.save();
    res.status(201).json(user.addresses);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { email, addressId, address } = req.body;
    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const addrIndex = user.addresses.findIndex(a => a._id.toString() === addressId);
    if (addrIndex === -1) return res.status(404).json({ message: 'Address not found' });

    if (address.isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }

    user.addresses[addrIndex] = { ...user.addresses[addrIndex].toObject(), ...address };
    await user.save();
    res.json(user.addresses);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { email, addressId } = req.query;
    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.addresses = user.addresses.filter(a => a._id.toString() !== addressId);
    await user.save();
    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
