const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.get('/', userController.getUsers);
router.put('/:id/role', userController.updateUserRole);
router.put('/:id/toggle-status', userController.toggleUserStatus);
router.delete('/:id', userController.deleteUser);

module.exports = router;
