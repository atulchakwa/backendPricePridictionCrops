const express = require('express');
const router = express.Router();
const { register, login, getProfile, refreshToken, logout } = require('../controllers/userController');
const { registerSchema, loginSchema, refreshTokenSchema } = require('../utils/validationSchemas');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);

// Protected routes
router.get('/profile', auth, getProfile);
router.post('/logout', auth, logout);

module.exports = router; 