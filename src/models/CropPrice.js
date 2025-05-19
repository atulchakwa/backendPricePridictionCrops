const mongoose = require('mongoose');

const cropPriceSchema = new mongoose.Schema({
  cropName: {
    type: String,
    required: [true, 'Crop name is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  market: {
    type: String,
    required: [true, 'Market is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true,
    enum: ['kg', 'quintal', 'ton']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
cropPriceSchema.index({ cropName: 1, location: 1, market: 1, date: -1 });

const CropPrice = mongoose.model('CropPrice', cropPriceSchema);

module.exports = CropPrice; 