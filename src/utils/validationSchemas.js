const { z } = require('zod');

// User registration schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

// User login schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Refresh token schema
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// Crop price schema
const cropPriceSchema = z.object({
  cropName: z.string().min(1, 'Crop name is required'),
  location: z.string().min(1, 'Location is required'),
  market: z.string().min(1, 'Market is required'),
  price: z.number().positive('Price must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  date: z.string().datetime('Invalid date format')
});

// Price prediction schema
const pricePredictionSchema = z.object({
  cropName: z.string().min(1, 'Crop name is required'),
  location: z.string().min(1, 'Location is required'),
  date: z.string().datetime('Invalid date format')
});

// Crop price query schema
const cropPriceQuerySchema = z.object({
  cropName: z.string().optional(),
  location: z.string().optional(),
  market: z.string().optional(),
  startDate: z.string().datetime('Invalid start date format').optional(),
  endDate: z.string().datetime('Invalid end date format').optional()
});

// Managed crop schema


// src/utils/validationSchemas.js (Backend)
// const { z } = require('zod');

// ... other schemas

const managedCropSchema = z.object({
  cropName: z.string().min(1, 'Crop name is required'),
  state: z.string().optional(), // If these are required, remove .optional()
  district: z.string().optional(), // If these are required, remove .optional()
  quantity: z.number().min(0, 'Quantity cannot be negative').nullable().optional(), // Allow null
  unit: z.enum(['kg', 'quintal', 'ton', 'acres', 'hectares', 'plants', 'other']).optional(),
  
  // --- MODIFIED DATE HANDLING ---
  plantingDate: z.preprocess((arg) => {
    if (typeof arg === 'string' && arg.trim() !== '') return new Date(arg);
    if (arg instanceof Date) return arg;
    return undefined; // or null, if you prefer to store null for empty dates
  }, z.date().nullable().optional()),
  
  expectedHarvestDate: z.preprocess((arg) => {
    if (typeof arg === 'string' && arg.trim() !== '') return new Date(arg);
    if (arg instanceof Date) return arg;
    return undefined;
  }, z.date().nullable().optional()),
  
  actualHarvestDate: z.preprocess((arg) => {
    if (typeof arg === 'string' && arg.trim() !== '') return new Date(arg);
    if (arg instanceof Date) return arg;
    return undefined;
  }, z.date().nullable().optional()),
  // --- END OF MODIFIED DATE HANDLING ---

  yieldAmount: z.number().min(0, 'Yield amount cannot be negative').nullable().optional(), // Allow null
  yieldUnit: z.enum(['kg', 'quintal', 'ton']).optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
});


module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  cropPriceSchema,
  pricePredictionSchema,
  cropPriceQuerySchema,
  managedCropSchema
}; 