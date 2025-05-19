const User = require('../models/User');
const { validateObjectId } = require('../utils/validationSchemas');

// Get user's tracked crops
exports.getTrackedCrops = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('trackedCrops');
    res.json({
      success: true,
      data: user.trackedCrops
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tracked crops'
    });
  }
};

// Add crop to tracked list
exports.addTrackedCrop = async (req, res) => {
  try {
    const { cropId } = req.body;
    
    if (!cropId) {
      return res.status(400).json({
        success: false,
        error: 'Crop ID is required'
      });
    }

    const user = await User.findById(req.user._id);
    
    // Prevent duplicate crops
    if (user.trackedCrops.includes(cropId)) {
      return res.status(400).json({
        success: false,
        error: 'Crop is already being tracked'
      });
    }

    user.trackedCrops.push(cropId);
    await user.save();

    res.json({
      success: true,
      data: user.trackedCrops
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add crop to tracked list'
    });
  }
};

// Remove crop from tracked list
exports.removeTrackedCrop = async (req, res) => {
  try {
    const { cropId } = req.params;
    
    const user = await User.findById(req.user._id);
    user.trackedCrops = user.trackedCrops.filter(crop => crop !== cropId);
    await user.save();

    res.json({
      success: true,
      data: user.trackedCrops
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to remove crop from tracked list'
    });
  }
};

// Update location preferences
exports.updateLocationPreferences = async (req, res) => {
  try {
    const { state, district } = req.body;
    
    const user = await User.findById(req.user._id);
    user.locationPreferences = { state, district };
    await user.save();

    res.json({
      success: true,
      data: user.locationPreferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update location preferences'
    });
  }
};

// Get location preferences
exports.getLocationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('locationPreferences');
    res.json({
      success: true,
      data: user.locationPreferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch location preferences'
    });
  }
}; 