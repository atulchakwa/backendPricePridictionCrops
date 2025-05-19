const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  addCropPrice,
  getCropPrices,
  getPredictedPrice
} = require('../controllers/cropPriceController');

// Protected routes
router.post('/prices', auth, addCropPrice);
router.get('/prices', auth, getCropPrices);
router.get('/predict', auth, getPredictedPrice);

module.exports = router; 