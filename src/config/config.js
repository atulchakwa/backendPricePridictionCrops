// src/config/config.js
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI', 
  'JWT_SECRET', 
  'JWT_REFRESH_SECRET',
  'PYTHON_API_BASE_URL' // Add this
];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Error: The following required environment variables are missing:');
  missingEnvVars.forEach(envVar => console.error(`- ${envVar}`));
  process.exit(1);
}

const getAvailablePort = async () => {
  const net = require('net');
  const port = parseInt(process.env.PORT || '5000'); // Default to 5000 if PORT is not set
  
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Try the next port (this simple version doesn't actually try next, but you could implement that)
        console.warn(`Port ${port} is in use. Trying another port logic might be needed or ensure port is free.`);
        reject(err); // Or resolve(port + 1) and make getAvailablePort recursive with a max retries
      } else {
        reject(err);
      }
    });
    
    server.listen(port, () => {
      server.close(() => {
        resolve(port);
      });
    });
  });
};

const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  mongoUri: process.env.MONGODB_URI, // Removed default for safety
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Python API configuration
  pythonApiBaseUrl: process.env.PYTHON_API_BASE_URL, // Read from .env
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173', // Adjusted to frontend port

  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@cropprice.com'
  },

  // Additional configuration
  agmarknetApiUrl: process.env.AGMARKNET_API_URL || 'https://api.agmarknet.gov.in/api',
  agmarknetApiKey: process.env.AGMARKNET_API_KEY || 'your-agmarknet-api-key',
  
  // Hugging Face configuration
  huggingFace: {
    apiKey: process.env.HUGGINGFACE_API_KEY,
    spaceUrl: process.env.HUGGINGFACE_SPACE_URL || 'https://rajkhanke007-crop-price-prediction.hf.space',
    modelUrl: process.env.HUGGINGFACE_MODEL_URL || 'https://api-inference.huggingface.co/models',
    timeout: parseInt(process.env.HUGGINGFACE_TIMEOUT || '30000', 10)
  }
};

module.exports = { config, getAvailablePort };