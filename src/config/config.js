const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Error: The following required environment variables are missing:');
  missingEnvVars.forEach(envVar => console.error(`- ${envVar}`));
  process.exit(1);
}

const getAvailablePort = async () => {
  const net = require('net');
  const port = parseInt(process.env.PORT);
  
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Try the next port
        resolve(getAvailablePort());
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
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/crop-price-prediction',
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET ,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Python API configuration
  pythonApiBaseUrl: process.env.PYTHON_API_BASE_URL || 'http://localhost:5001',
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

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
  agmarknetApiKey: process.env.AGMARKNET_API_KEY || 'your-agmarknet-api-key'
};

module.exports = { config, getAvailablePort }; 