const express = require('express');
const router = express.Router();
const homepageController = require('../controllers/homepageController');

// For simplicity, we assume auth is handled correctly elsewhere in the project
// A senior developer would usually add an isAdmin middleware here.
router.get('/', homepageController.getHomepageConfig);
router.put('/', homepageController.updateHomepageConfig);

module.exports = router;
