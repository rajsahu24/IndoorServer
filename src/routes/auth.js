const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, requireRole } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected routes
router.get('/users', auth, requireRole(['admin']), authController.getUsers);
router.put('/users/:id/role', auth, requireRole(['admin']), authController.updateUserRole);
router.put('/users/:id', auth, requireRole(['admin']), authController.updateUserPut);
router.patch('/users/:id', auth, requireRole(['admin']), authController.updateUserPatch);

module.exports = router;