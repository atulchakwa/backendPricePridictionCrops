const agmarknetService = require('../services/agmarknetService');
const CropPrice = require('../models/CropPrice');
const { cropPriceSchema, cropPriceQuerySchema, predictionSchema } = require('../utils/validationSchemas');

// Get crop prices with filters
const getCropPrices = async (req, res) => {
  try {
    // Validate query parameters
    const validatedQuery = cropPriceQuerySchema.parse(req.query);
    
    // Build filter object
    const filter = {};
    if (validatedQuery.cropName) filter.cropName = validatedQuery.cropName;
    if (validatedQuery.location) filter.location = validatedQuery.location;
    if (validatedQuery.market) filter.market = validatedQuery.market;
    
    // Add date range filter if provided
    if (validatedQuery.startDate || validatedQuery.endDate) {
      filter.date = {};
      if (validatedQuery.startDate) filter.date.$gte = validatedQuery.startDate;
      if (validatedQuery.endDate) filter.date.$lte = validatedQuery.endDate;
    }
    
    // Set limit
    const limit = validatedQuery.limit || 100;
    
    // Query database
    const cropPrices = await CropPrice.find(filter)
      .sort({ date: -1 })
      .limit(limit);
    
    res.json({
      success: true,
      count: cropPrices.length,
      data: cropPrices
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error fetching crop prices'
    });
  }
};

// Fetch and store latest crop prices from Agmarknet
const fetchLatestPrices = async (req, res) => {
  try {
    const params = req.query;
    const cropPrices = await agmarknetService.fetchCropPrices(params);

    res.json({
      success: true,
      data: cropPrices,
      message: 'Successfully fetched and stored latest crop prices'
    });
  } catch (error) {
    console.error('Fetch latest prices error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching latest crop prices'
    });
  }
};

// Add new crop price
const addCropPrice = async (req, res) => {
  try {
    // Validate request body
    const validatedData = cropPriceSchema.parse(req.body);
    
    // Create new crop price
    const cropPrice = new CropPrice({
      ...validatedData,
      addedBy: req.user._id
    });
    
    await cropPrice.save();
    
    res.status(201).json({
      success: true,
      data: cropPrice
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error adding crop price'
    });
  }
};

// Get predicted price
const getPredictedPrice = async (req, res) => {
  try {
    // Validate request body
    const validatedData = predictionSchema.parse(req.body);
    
    // Use Hugging Face service for prediction
    const huggingFaceService = require('../services/huggingFaceService');
    
    const predictionData = {
      cropName: validatedData.cropName,
      state: validatedData.state || 'Punjab',
      city: validatedData.location,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1
    };
    
    const predictionResult = await huggingFaceService.getCropPricePrediction(predictionData);
    
    res.json(predictionResult);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    console.error('Error getting prediction:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting prediction'
    });
  }
};

module.exports = {
  getCropPrices,
  fetchLatestPrices,
  addCropPrice,
  getPredictedPrice
}; 