const Inquiry = require('../models/Inquiry');

exports.getInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json({ inquiries });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createInquiry = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;
    const newInquiry = new Inquiry({ firstName, lastName, email, phone, message });
    await newInquiry.save();
    res.status(201).json(newInquiry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
