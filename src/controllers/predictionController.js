const axios = require('axios');
const config = require('../config/config');

// Get price prediction
const getPrediction = async (req, res) => {
  try {
    const { cropName, state, market, date } = req.body;

    // For now, mock the prediction
    // TODO: Replace with actual ML model API call
    const mockPrediction = {
      cropName,
      state,
      market,
      date,
      predictedPrice: Math.random() * 1000 + 500, // Random price between 500 and 1500
      confidence: Math.random() * 0.3 + 0.7, // Random confidence between 0.7 and 1.0
      unit: 'quintal'
    };

    // When ML model is ready, uncomment this:
    /*
    const response = await axios.post(config.mlApiUrl + '/predict', {
      cropName,
      state,
      market,
      date
    });
    */

    res.json({
      success: true,
      data: mockPrediction
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting price prediction'
    });
  }
};

module.exports = {
  getPrediction
}; 