const HomepageConfig = require('../models/HomepageConfig');

exports.getHomepageConfig = async (req, res) => {
  try {
    let config = await HomepageConfig.findOne();
    if (!config) {
      config = await HomepageConfig.create({});
    }

    const populatedConfig = await HomepageConfig.findById(config._id)
      .populate({ path: 'popularProducts', populate: { path: 'category' } })
      .populate({ path: 'featuredProducts', populate: { path: 'category' } })
      .populate('selectedCategories')
      .populate({ path: 'customSectionProducts', populate: { path: 'category' } });

    res.json(populatedConfig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateHomepageConfig = async (req, res) => {
  try {
    let config = await HomepageConfig.findOne();
    if (!config) {
      config = new HomepageConfig(req.body);
      await config.save();
    } else {
      config = await HomepageConfig.findByIdAndUpdate(config._id, req.body, { new: true });
    }
    res.json(config);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
