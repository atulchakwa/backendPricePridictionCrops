// src/utils/validationSchemas.js
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

// Price prediction schema (likely for a different endpoint than the dashboard's form)
const simplePricePredictionSchema = z.object({
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

const managedCropSchema = z.object({
  cropName: z.string().min(1, 'Crop name is required'),
  state: z.string().optional(),
  district: z.string().optional(),
  quantity: z.number().min(0, 'Quantity cannot be negative').nullable().optional(),
  unit: z.enum(['kg', 'quintal', 'ton', 'acres', 'hectares', 'plants', 'other']).optional(),
  plantingDate: z.preprocess((arg) => {
    if (typeof arg === 'string' && arg.trim() !== '') return new Date(arg);
    if (arg instanceof Date) return arg;
    return undefined;
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
  yieldAmount: z.number().min(0, 'Yield amount cannot be negative').nullable().optional(),
  yieldUnit: z.enum(['kg', 'quintal', 'ton']).optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
});

// Schema for the payload from PredictPriceForm.jsx to Node.js backend (/api/predictions)
const dashboardFormPredictionSchema = z.object({
  date: z.string().refine(val => /^\d{4}-\d{2}-\d{2}$/.test(val) && !isNaN(Date.parse(val)), {
    message: "Date is required in YYYY-MM-DD format"
  }),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  croptype: z.string().min(1, "Crop type is required"),
  season: z.string().min(1, "Season is required"),
  temp: z.coerce.number({ invalid_type_error: "Temperature must be a number" }),
  rainfall: z.coerce.number({ invalid_type_error: "Rainfall must be a number" }).min(0, "Rainfall cannot be negative"),
  supply: z.coerce.number({ invalid_type_error: "Supply must be a number" }).min(0, "Supply cannot be negative"),
  demand: z.coerce.number({ invalid_type_error: "Demand must be a number" }).min(0, "Demand cannot be negative"),
  fertilizerused: z.coerce.number({ invalid_type_error: "Fertilizer used must be a number" }).min(0, "Fertilizer used cannot be negative"),
  n_periods: z.coerce.number({ invalid_type_error: "Forecast days must be a number" })
                 .int({ message: "Forecast days must be an integer" })
                 .positive({ message: "Forecast days must be positive" })
                 .min(1, { message: "Forecast days must be at least 1" })
                 .max(30, { message: "Forecast days cannot exceed 30" }),
});

// Schema for a different prediction model (SARIMAX-like, if still used elsewhere)
const timeSeriesSarimaxSchema = z.object({
  commodityName: z.string().min(1, "Commodity is required"),
  state: z.string().optional(),
  district: z.string().optional(),
  marketName: z.string().optional(),
  n_periods: z.coerce.number().int().positive("Forecast days must be a positive number").min(1).max(30, "Max 30 days"),
  future_exog1_values_str: z.string().min(1, "Future exogenous values are required")
    .refine(val => {
        const parts = val.split(',');
        if (val.trim() === '') return false;
        return parts.every(v => !isNaN(parseFloat(v.trim())));
    }, {
        message: "All future_exog1 values must be comma-separated numbers."
    }),
});


module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  cropPriceSchema,
  pricePredictionSchema: simplePricePredictionSchema, // For /api/crop-prices/predict (if different)
  cropPriceQuerySchema,
  managedCropSchema,
  predictionSchema: dashboardFormPredictionSchema, // THIS IS FOR /api/predictions
  timeSeriesSarimaxSchema, // Keep if used elsewhere
};