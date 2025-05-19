const express = require('express');
const router = express.Router();
const { getPrediction } = require('../controllers/predictionController');
const { predictionSchema } = require('../utils/validationSchemas');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

// Protected route
router.post('/', auth, validate(predictionSchema), getPrediction);

module.exports = router; 