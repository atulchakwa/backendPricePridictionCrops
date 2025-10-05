const express = require('express');
const router = express.Router();
const { getPrediction } = require('../controllers/predictionController');
const { predictionSchema } = require('../utils/validationSchemas'); // Make sure this is the correct schema for the frontend payload
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth'); // Destructure the auth function here

// Public test route (for testing Hugging Face integration)
router.post(
  '/test',
  validate(predictionSchema), // This middleware will validate req.body against predictionSchema
  getPrediction // This is your final route handler
);

// Protected route
router.post(
  '/',
  auth, // Now 'auth' refers directly to the middleware function
  validate(predictionSchema), // This middleware will validate req.body against predictionSchema
  getPrediction // This is your final route handler
);

module.exports = router;