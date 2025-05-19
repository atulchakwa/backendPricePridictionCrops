// src/controllers/managedCropController.js
const User = require('../models/User');
const { managedCropSchema } = require('../utils/validationSchemas'); // Assuming you have this Zod schema
const { z } = require('zod'); // Import Zod itself for potential ad-hoc validation if needed

// Get all managed crops for the authenticated user
exports.getManagedCrops = async (req, res, next) => {
    try {
        // req.user is populated by the 'auth' middleware
        const user = await User.findById(req.user._id).select('myManagedCrops');
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found." });
        }
        res.json({ success: true, data: user.myManagedCrops || [] });
    } catch (error) {
        console.error("Error fetching user's managed crops:", error);
        // Pass to global error handler
        next(error); 
    }
};

// Add a new managed crop for the authenticated user
exports.addManagedCrop = async (req, res, next) => {
    try {
        const userId = req.user._id;
        
        // Validate request body using Zod schema
        const validatedData = managedCropSchema.parse(req.body);

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found." });
        }

        user.myManagedCrops.push(validatedData); // Mongoose will assign an _id to the subdocument
        await user.save();
        
        // Return the full updated user profile so frontend AuthContext can be updated
        res.status(201).json({ 
            success: true, 
            message: "Crop added successfully", 
            data: user.getPublicProfile() // Ensure getPublicProfile includes myManagedCrops
        });
    } catch (error) {
        console.error("Error adding managed crop:", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                success: false, 
                error: "Validation failed", 
                details: error.errors 
            });
        }
        next(error);
    }
};

// Update a specific managed crop for the authenticated user
exports.updateManagedCrop = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { cropMongoId } = req.params; // Parameter name matches the route definition
        
        // Validate request body
        const validatedData = managedCropSchema.parse(req.body);

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found." });
        }

        const cropToUpdate = user.myManagedCrops.id(cropMongoId); // Mongoose helper to find subdocument by _id
        
        if (!cropToUpdate) {
            return res.status(404).json({ success: false, error: "Managed crop not found." });
        }

        // Update fields of the subdocument
        Object.assign(cropToUpdate, validatedData);
        
        await user.save();
        
        res.json({ 
            success: true, 
            message: "Crop updated successfully", 
            data: user.getPublicProfile() 
        });
    } catch (error) {
        console.error("Error updating managed crop:", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                success: false, 
                error: "Validation failed", 
                details: error.errors 
            });
        }
        next(error);
    }
};

// Delete a specific managed crop for the authenticated user
exports.deleteManagedCrop = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { cropMongoId } = req.params; // Parameter name matches the route definition

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found." });
        }

        const cropToRemove = user.myManagedCrops.id(cropMongoId);
        if (!cropToRemove) {
            return res.status(404).json({ success: false, error: "Managed crop not found to delete." });
        }
        
        // Mongoose v6+ way to remove subdocument:
        // If you are on Mongoose 7 as per your package.json, .deleteOne() might not be directly available on subdocument.
        // The standard way is to pull it from the array.
        user.myManagedCrops.pull({ _id: cropMongoId }); // Use pull for removing from array
        // For Mongoose 5 and older: cropToRemove.remove();

        await user.save();
        
        res.json({ 
            success: true, 
            message: "Crop deleted successfully", 
            data: user.getPublicProfile() 
        });
    } catch (error) {
        console.error("Error deleting managed crop:", error);
        next(error);
    }
};