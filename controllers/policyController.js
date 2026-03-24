const Policy = require('../models/Policy');

exports.getPolicies = async (req, res) => {
  try {
    const policies = await Policy.find().sort({ title: 1 });
    res.json(policies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPolicyBySlug = async (req, res) => {
  try {
    const policy = await Policy.findOne({ slug: req.params.slug });
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    res.json(policy);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createPolicy = async (req, res) => {
  try {
    const policy = new Policy(req.body);
    const newPolicy = await policy.save();
    res.status(201).json(newPolicy);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updatePolicy = async (req, res) => {
  try {
    const updated = await Policy.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Policy not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deletePolicy = async (req, res) => {
  try {
    const deleted = await Policy.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Policy not found' });
    res.json({ message: 'Policy deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
