const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, addressController.getAddresses);
router.post('/', protect, addressController.addAddress);
router.put('/', protect, addressController.updateAddress);
router.delete('/', protect, addressController.deleteAddress);


module.exports = router;
