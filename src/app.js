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
const predictionRoutes = require('./routes/predictionRoutes');
const errorHandler = require('./middleware/errorHandler');
const { schedulePriceChecks } = require('./cron/priceAlertCron');

// Create Express app
const app = express();

// ----------------- CORS -----------------
const corsOptions = {
  origin: config.corsOrigin, // Frontend URL from config
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Handle preflight OPTIONS requests
app.options('*', cors(corsOptions));

// ----------------- Middleware -----------------
app.use(express.json()); // Parse JSON

// Handle malformed JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && err.type === 'entity.parse.failed') {
    console.error('Malformed JSON in request body:', err.message);
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON format in request body',
    });
  }
  next(err);
});

// ----------------- Routes -----------------
app.use('/api/auth', authRoutes);
app.use('/api/crop-prices', cropPriceRoutes);
app.use('/api/user-preferences', userPreferencesRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/managed-crops', managedCropRoutes);
app.use('/api/predictions', predictionRoutes);

// ----------------- Error Handling -----------------
app.use(errorHandler);

// ----------------- MongoDB Connection -----------------
mongoose.connect(config.mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');

    if (process.env.NODE_ENV !== 'test') {
      schedulePriceChecks();
      console.log('Price alert cron job started');
    }
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// ----------------- Start Server -----------------
const startServer = async () => {
  try {
    const port = await getAvailablePort();
    const server = app.listen(port, () => {
      console.log(`MERN Backend server is running on port ${port}`);
    });

    server.on('error', (error) => {
      console.error('Server error:', error);
      process.exit(1);
    });

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

// Don't start server during tests
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
