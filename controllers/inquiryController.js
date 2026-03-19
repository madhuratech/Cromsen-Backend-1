const Inquiry = require('../models/Inquiry');
const mockDB = require('../mockDB');
const mongoose = require('mongoose');
const path = require('path');

exports.getInquiries = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ inquiries: mockDB.inquiries || [] });
    }
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json({ inquiries });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createInquiry = async (req, res) => {
  try {
    const { firstName, lastName, email, message } = req.body;
    
    if (mongoose.connection.readyState !== 1) {
      const newInquiry = {
        _id: "inq_mock_" + Date.now(),
        firstName,
        lastName,
        email,
        message,
        createdAt: new Date().toISOString()
      };
      if (!mockDB.inquiries) mockDB.inquiries = [];
      mockDB.inquiries.push(newInquiry);
      mockDB.save(path.join(__dirname, '../data/inquiries.json'), mockDB.inquiries);
      return res.status(201).json(newInquiry);
    }
    
    const newInquiry = new Inquiry({ firstName, lastName, email, message });
    await newInquiry.save();
    res.status(201).json(newInquiry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
