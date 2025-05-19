const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

// Location data routes
router.get('/states', locationController.getStates);
router.get('/districts', locationController.getDistrictsByState);
router.get('/crops', locationController.getCropsByLocation);

module.exports = router; 