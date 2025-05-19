const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { config } = require('../config/config');

const auth = async (req, res, next) => {
  try {
    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('No authorization header found');
      return res.status(401).json({
        success: false,
        error: 'No authorization header'
      });
    }

    // Check if token format is correct
    if (!authHeader.startsWith('Bearer ')) {
      console.log('Invalid token format:', authHeader);
      return res.status(401).json({
        success: false,
        error: 'Invalid token format'
      });
    }

    // Get token from header
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    try {
      console.log('Verifying token with secret:', config.jwtSecret);
      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret);
      console.log('Token decoded:', decoded);
      
      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        console.log('User not found for ID:', decoded.userId);
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      // Add user to request
      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired'
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Error authenticating user'
    });
  }
};

module.exports = { auth }; 