const Service = require('../models/Service');

exports.getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getServiceBySlug = async (req, res) => {
  try {
    const service = await Service.findOne({ slug: req.params.slug });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createService = async (req, res) => {
  try {
    const serviceData = { ...req.body };
    if (!req.file) {
      return res.status(400).json({ message: 'Service image is required.' });
    }
    serviceData.image = req.file.path;
    
    // Convert isActive if it's a string
    if (typeof serviceData.isActive === 'string') {
      serviceData.isActive = serviceData.isActive === 'true';
    }

    const service = new Service(serviceData);
    const newService = await service.save();
    res.status(201).json(newService);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A service with this heading already exists.' });
    }
    res.status(400).json({ message: err.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const serviceData = { ...req.body };
    if (req.file) {
      serviceData.image = req.file.path;
    }
    
    if (typeof serviceData.isActive === 'string') {
      serviceData.isActive = serviceData.isActive === 'true';
    }

    const updated = await Service.findByIdAndUpdate(req.params.id, serviceData, { new: true });
    if (!updated) return res.status(404).json({ message: 'Service not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const deleted = await Service.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Service not found' });
    res.json({ message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
