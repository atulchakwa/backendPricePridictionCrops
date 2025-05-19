const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const managedCropController = require('../controllers/managedCropController');

// Protected routes
router.post('/', auth, managedCropController.addManagedCrop);
router.get('/', auth, managedCropController.getManagedCrops);
router.put('/:cropMongoId', auth, managedCropController.updateManagedCrop); // Match param name
router.delete('/:cropMongoId', auth, managedCropController.deleteManagedCrop); // Match param name


module.exports = router; 