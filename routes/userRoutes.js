const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../middleware/upload');

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.get('/', userController.getUsers);
router.put('/:id/role', userController.updateUserRole);
router.put('/:id/toggle-status', userController.toggleUserStatus);
router.get('/:id/profile', userController.getUserProfile);
router.put('/:id/profile', userController.updateUserProfile);
router.post('/:id/upload-avatar', upload.single('avatar'), userController.uploadAvatar);
router.delete('/:id', userController.deleteUser);



module.exports = router;
