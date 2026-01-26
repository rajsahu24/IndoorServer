const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, requireRole } = require('../middleware/auth');
const passport = require('../config/googleAuth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', auth, authController.me);

// Google OAuth routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login',  session: false }),
  authController.googleCallback
);

// Protected routes
router.get('/users', auth, requireRole(['admin','host']), authController.getUsers);
router.get('/users/:id', auth, requireRole(['admin', 'host']), authController.getUserById);
router.put('/users/:id/role', auth, requireRole(['admin','host']), authController.updateUserRole);
router.put('/users/:id', auth, requireRole(['admin','host']), authController.updateUserPut);
router.patch('/users/:id', auth, requireRole(['admin','host']), authController.updateUserPatch);
module.exports = router;