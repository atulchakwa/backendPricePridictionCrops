// src/middleware/validate.js
const validate = (schema) => async (req, res, next) => {
  try {
    // For POST/PUT, we typically validate req.body directly
    // If the schema is for query or params, this middleware would need adjustment
    // or separate middlewares would be used.
    // For now, assuming this `validate` is primarily for `req.body`.
    await schema.parseAsync(req.body);
    next();
  } catch (error) {
    // Log the detailed Zod error to the backend console for easier debugging
    console.error("Zod Validation Error in Middleware:", JSON.stringify(error.errors, null, 2));
    
    // Send a structured error response to the frontend
    res.status(400).json({
      success: false,
      message: 'Validation failed. Please check your input.',
      errors: error.format(), // Zod's error.format() gives a more user-friendly error structure
    });
  }
};

module.exports = validate;