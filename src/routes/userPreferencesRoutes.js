const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const userPreferencesController = require('../controllers/userPreferencesController');

// Tracked crops routes
router.get('/crops', auth, userPreferencesController.getTrackedCrops);
router.post('/crops', auth, userPreferencesController.addTrackedCrop);
router.delete('/crops/:cropId', auth, userPreferencesController.removeTrackedCrop);

// Location preferences routes
router.get('/location', auth, userPreferencesController.getLocationPreferences);
router.put('/location', auth, userPreferencesController.updateLocationPreferences);

module.exports = router; 