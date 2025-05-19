// src/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the schema for a single managed crop
const managedCropSchema = new mongoose.Schema({
  cropName: {
    type: String,
    required: [true, 'Managed crop name is required'],
    trim: true,
  },
  state: {
    type: String,
    trim: true,
  },
  district: {
    type: String,
    trim: true,
  },
  quantity: {
    type: Number,
    min: [0, 'Quantity cannot be negative'],
  },
  unit: {
    type: String,
    enum: ['kg', 'quintal', 'ton', 'acres', 'hectares', 'plants', 'other'],
    default: 'quintal',
    trim: true,
  },
  plantingDate: {
    type: Date,
  },
  expectedHarvestDate: {
    type: Date,
  },
  actualHarvestDate: {
    type: Date,
  },
  yieldAmount: { 
    type: Number,
    min: [0, 'Yield amount cannot be negative']
  },
  yieldUnit: { 
    type: String,
    enum: ['kg', 'quintal', 'ton'],
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
}, { _id: true }); // Ensure each managed crop gets its own _id

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  refreshToken: {
    type: String,
    default: null
  },
  trackedCrops: [{ // For general tracking/dashboard (simple list of crop names)
    type: String,
    trim: true
  }],
  locationPreferences: { // For default filtering in predictions etc.
    state: {
      type: String,
      trim: true
    },
    district: {
      type: String,
      trim: true
    }
  },
  subscribedToAlerts: { // General subscription to email alerts
    type: Boolean,
    default: false
  },
  alertPreferences: { // For price alert notifications
    // General preferences that might apply if no specific alert matches
    priceChangeThreshold: { 
      type: Number,
      default: 20, 
      min: 1,
      max: 100
    },
    checkFrequency: { 
      type: String,
      enum: ['6h', '12h', '24h'],
      default: '12h'
    },
    // Specific alerts user creates:
    alerts: [{ // Array to store specific alert configurations
        cropName: { type: String, required: true, trim: true },
        location: { type: String, required: true, trim: true }, // e.g., "State - District" or "Market Name"
        thresholdPercentage: { type: Number, required: true, min: 1, max: 100 },
        alertType: { type: String, enum: ['rise', 'fall', 'both'], required: true },
        lastTriggered: { type: Date, default: null } // To avoid re-sending same alert too soon
    }]
    // The 'crops' and 'locations' arrays from your original schema were a bit ambiguous.
    // If they were meant for general "alert me about ANY changes for these crops/locations",
    // they could be kept. But the `alerts` array above is for more specific user-defined alerts.
    // I've removed the old `crops` and `locations` fields from `alertPreferences` for clarity,
    // assuming specific alerts are preferred. If you need the general ones, they can be added back.
  },
  myManagedCrops: [managedCropSchema], // <<< This is the newly added field
  lastAlertSent: { // General timestamp for last alert of any kind sent to the user
    type: Date,
    default: null
  }
}, {
  timestamps: true // Timestamps for the User document itself (createdAt, updatedAt)
});

// Ensure unique index on email
userSchema.index({ email: 1 }, { unique: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('Comparing passwords for user:', this.email);
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password match result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw error;
  }
};

// Get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  
  // Remove sensitive data
  delete userObject.password;
  delete userObject.refreshToken;
  
  // Return only the fields we want to expose
  return {
    _id: userObject._id,
    name: userObject.name,
    email: userObject.email,
    phone: userObject.phone,
    role: userObject.role,
    trackedCrops: userObject.trackedCrops,
    locationPreferences: userObject.locationPreferences,
    subscribedToAlerts: userObject.subscribedToAlerts,
    alertPreferences: userObject.alertPreferences,
    myManagedCrops: userObject.myManagedCrops, // Include the managed crops
    createdAt: userObject.createdAt,
    updatedAt: userObject.updatedAt
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;