const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  register,
  login,
  logout,
  getProfile,
  refreshToken
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', auth, logout);
router.get('/me', auth, getProfile);
router.post('/refresh-token', refreshToken);

module.exports = router; 