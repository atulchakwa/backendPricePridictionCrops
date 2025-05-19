const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { config } = require('../config/config');
const { registerSchema, loginSchema, refreshTokenSchema } = require('../utils/validationSchemas');

// Register new user
const register = async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    
    // Validate request body
    const validatedData = registerSchema.parse(req.body);
    console.log('Validated data:', validatedData);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }
    
    // Create new user
    const user = new User({
      name: validatedData.name,
      email: validatedData.email,
      password: validatedData.password
    });
    
    await user.save();
    console.log('User saved successfully');
    
    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user._id },
      config.jwtRefreshSecret,
      { expiresIn: '7d' }
    );
    
    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();
    
    res.status(201).json({
      success: true,
      data: {
        user: user.getPublicProfile(),
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error registering user',
      details: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    
    // Validate request body
    const validatedData = loginSchema.parse(req.body);
    console.log('Validated data:', validatedData);
    
    // Find user
    const user = await User.findOne({ email: validatedData.email });
    if (!user) {
      console.log('User not found:', validatedData.email);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(validatedData.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', validatedData.email);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    console.log('Generating tokens for user:', user.email);
    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    
    const refreshToken = jwt.sign(
      { userId: user._id },
      config.jwtRefreshSecret,
      { expiresIn: config.jwtRefreshExpiresIn }
    );
    
    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();
    
    console.log('Login successful for user:', user.email);
    
    res.json({
      success: true,
      data: {
        user: user.getPublicProfile(),
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error logging in',
      details: error.message
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    // Remove refresh token from user
    req.user.refreshToken = undefined;
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error logging out'
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching profile'
    });
  }
};

// Refresh access token
const refreshToken = async (req, res) => {
  try {
    // Validate request body
    const validatedData = refreshTokenSchema.parse(req.body);
    
    // Verify refresh token
    const decoded = jwt.verify(validatedData.refreshToken, config.jwtRefreshSecret);
    
    // Find user
    const user = await User.findOne({
      _id: decoded.userId,
      refreshToken: validatedData.refreshToken
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
    
    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user._id },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    
    res.json({
      success: true,
      data: {
        accessToken
      }
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error refreshing token'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  refreshToken
}; 