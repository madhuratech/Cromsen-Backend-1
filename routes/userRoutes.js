const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../middleware/upload');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Admin only routes
router.get('/', protect, adminOnly, userController.getUsers);
router.put('/:id/role', protect, adminOnly, userController.updateUserRole);
router.put('/:id/toggle-status', protect, adminOnly, userController.toggleUserStatus);
router.delete('/:id', protect, adminOnly, userController.deleteUser);

// Protected routes (available to any logged in user/admin)
router.get('/:id/profile', protect, userController.getUserProfile);
router.put('/:id/profile', protect, userController.updateUserProfile);
router.post('/:id/upload-avatar', protect, upload.single('avatar'), userController.uploadAvatar);




module.exports = router;
