const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { config, getAvailablePort } = require('./config/config');
const authRoutes = require('./routes/authRoutes');
const cropPriceRoutes = require('./routes/cropPriceRoutes');
const userPreferencesRoutes = require('./routes/userPreferencesRoutes');
const locationRoutes = require('./routes/locationRoutes');
const managedCropRoutes = require('./routes/managedCropRoutes');
const errorHandler = require('./middleware/errorHandler');
const { schedulePriceChecks } = require('./cron/priceAlertCron');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true,
}));

// JSON parsing middleware with error handling
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON format in request body'
    });
  }
  next();
});

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/crop-prices', cropPriceRoutes);
app.use('/api/user-preferences', userPreferencesRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/managed-crops', managedCropRoutes);
// Error handling
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(config.mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start the price alert cron job
    schedulePriceChecks();
    console.log('Price alert cron job started');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Start server
const startServer = async () => {
  try {
    const port = await getAvailablePort();
    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
      process.exit(1);
    });

    // Handle process termination
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed');
          process.exit(0);
        });
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app; 