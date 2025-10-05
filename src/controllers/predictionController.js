// src/controllers/predictionController.js
const axios = require('axios');
const { config } = require('../config/config');
const huggingFaceService = require('../services/huggingFaceService');

exports.getPrediction = async (req, res, next) => {
  try {
    // req.body has been validated by the `validate(predictionSchema)` middleware
    // using `dashboardFormPredictionSchema`.
    const validatedFrontendData = req.body;

    console.log("Received prediction request:", validatedFrontendData);

    // Prepare data for Hugging Face service
    const predictionData = {
      cropName: validatedFrontendData.croptype,
      state: validatedFrontendData.state,
      city: validatedFrontendData.city,
      year: validatedFrontendData.year || new Date().getFullYear(),
      month: validatedFrontendData.month || new Date().getMonth() + 1,
      season: validatedFrontendData.season,
      temperature: validatedFrontendData.temp,
      rainfall: validatedFrontendData.rainfall,
      supply: validatedFrontendData.supply,
      demand: validatedFrontendData.demand,
      fertilizerUsage: validatedFrontendData.fertilizerused
    };

    // Get prediction from Hugging Face service
    const predictionResult = await huggingFaceService.getCropPricePrediction(predictionData);

    console.log("Hugging Face Prediction Result:", predictionResult);

    // Return the formatted response
    res.status(200).json(predictionResult);

  } catch (error) {
    console.error("Prediction Error in Controller:", error);

    // Handle different types of errors
    if (error.message.includes('Failed to get prediction')) {
      return res.status(503).json({ 
        success: false, 
        error: "Prediction service temporarily unavailable. Please try again later.",
        details: error.message
      });
    } else if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: "Invalid input data",
        details: error.message
      });
    } else {
      // Pass to global error handler for unexpected errors
      return next(error);
    }
  }
};