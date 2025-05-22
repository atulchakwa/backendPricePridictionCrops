// src/controllers/predictionController.js
const axios = require('axios');
const { config } = require('../config/config');

exports.getPrediction = async (req, res, next) => {
  try {
    // req.body has been validated by the `validate(predictionSchema)` middleware
    // using `dashboardFormPredictionSchema`.
    const validatedFrontendData = req.body;

    // Parse date from "YYYY-MM-DD" format
    const dateParts = validatedFrontendData.date.split('-');
    const year = dateParts[0];
    const month = String(parseInt(dateParts[1], 10)); // Ensure month is not zero-padded if Python expects "1" not "01"

    // Construct the payload for the Python ML model based on the curl example
    const pythonPayload = {
      "Year": year,
      "Month": month,
      "State": validatedFrontendData.state,
      "City": validatedFrontendData.city,
      "Crop Type": validatedFrontendData.croptype, // Key must match Python model
      "Season": validatedFrontendData.season,
      "Temperature": String(validatedFrontendData.temp), // Python model expects strings for numbers
      "Rainfall": String(validatedFrontendData.rainfall),
      "Supply": String(validatedFrontendData.supply),
      "Demand": String(validatedFrontendData.demand),
      "Fertilizer Usage (kg/hectare)": String(validatedFrontendData.fertilizerused) // Key must match
      // Note: validatedFrontendData.n_periods is NOT sent as it's not in the curl example.
    };

    console.log("Sending to Python API (/predict):", pythonPayload);

    const mlResponse = await axios.post(`${config.pythonApiBaseUrl}/predict`, pythonPayload, {
      timeout: 20000 // Increased timeout
    });

    console.log("ML Service Response:", mlResponse.data);

    // Standardize response to frontend
    res.status(200).json({ success: true, data: mlResponse.data });

  } catch (error) {
    console.error("Prediction Error in Controller:", error);

    if (error.response) { // Error from Python service
      console.error("ML Service Error Response Status:", error.response.status);
      console.error("ML Service Error Response Data:", error.response.data);
      const pythonErrorMsg = error.response.data?.error || error.response.data?.detail || "ML service failed to process the request.";
      return res.status(error.response.status).json({
        success: false,
        error: pythonErrorMsg,
        details: error.response.data
      });
    } else if (error.request) { // No response from Python service
      console.error("ML Service No Response:", error.message);
      return res.status(503).json({ success: false, error: "ML service unavailable or did not respond. Please try again." });
    } else { // Other errors within this controller
      console.error("Internal Server Error in Prediction Controller:", error.message);
      // Pass to global error handler
      return next(error);
    }
  }
};