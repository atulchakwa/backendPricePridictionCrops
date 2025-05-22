// src/app.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { config, getAvailablePort } = require('./config/config');
const authRoutes = require('./routes/authRoutes');
const cropPriceRoutes = require('./routes/cropPriceRoutes');
const userPreferencesRoutes = require('./routes/userPreferencesRoutes');
const locationRoutes = require('./routes/locationRoutes');
const managedCropRoutes = require('./routes/managedCropRoutes');
const predictionRoutes = require('./routes/predictionRoutes'); // <<< ADD THIS
const errorHandler = require('./middleware/errorHandler');
const { schedulePriceChecks } = require('./cron/priceAlertCron');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin, // Use config for origin
  credentials: true,
}));

app.use(express.json()); // Make sure this is before routes and error handler for JSON parsing

// JSON parsing error handler (place after express.json())
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Malformed JSON in request body:', err.message);
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON format in request body'
    });
  }
  next(err); // Pass other errors to the next error handler
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/crop-prices', cropPriceRoutes);
app.use('/api/user-preferences', userPreferencesRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/managed-crops', managedCropRoutes);
app.use('/api/predictions', predictionRoutes); // <<< ADD THIS

// Error handling (should be the last middleware)
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(config.mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start the price alert cron job
    if (process.env.NODE_ENV !== 'test') { // Avoid running cron during tests if any
      schedulePriceChecks();
      console.log('Price alert cron job started');
    }
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Start server
const startServer = async () => {
  try {
    const port = await getAvailablePort(); // config.port is already parsed or defaulted
    const server = app.listen(port, () => {
      console.log(`MERN Backend server is running on port ${port}`);
    });

    server.on('error', (error) => {
      console.error('MERN Server error:', error);
      process.exit(1);
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down MERN server gracefully...');
      server.close(() => {
        console.log('MERN Server closed');
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed');
          process.exit(0);
        });
      });
    });
  } catch (error) {
    console.error('Failed to start MERN server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') { // Don't auto-start server during tests
    startServer();
}

module.exports = app;