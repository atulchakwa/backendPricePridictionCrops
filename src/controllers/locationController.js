const CropPrice = require('../models/CropPrice');

// Get all unique states
exports.getStates = async (req, res) => {
  try {
    const states = await CropPrice.distinct('state');
    res.json({
      success: true,
      data: states.sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch states'
    });
  }
};

// Get districts by state
exports.getDistrictsByState = async (req, res) => {
  try {
    const { state } = req.query;
    
    if (!state) {
      return res.status(400).json({
        success: false,
        error: 'State parameter is required'
      });
    }

    const districts = await CropPrice.distinct('district', { state });
    res.json({
      success: true,
      data: districts.sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch districts'
    });
  }
};

// Get unique crops by location
exports.getCropsByLocation = async (req, res) => {
  try {
    const { state, district } = req.query;
    const query = {};
    
    if (state) query.state = state;
    if (district) query.district = district;

    const crops = await CropPrice.distinct('cropName', query);
    res.json({
      success: true,
      data: crops.sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch crops'
    });
  }
}; 