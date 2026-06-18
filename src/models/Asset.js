const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  lender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  condition: {
    type: String
  },
  originalPrice: {
    type: Number,
    required: false
  },
  purchaseYear: {
    type: Number,
    required: false
  },
  itemConditionRate: {
    type: Number,
    required: false // 0-100%
  },
  depositCalculationMode: {
    type: String,
    enum: ['fixed', 'auto'],
    default: 'fixed'
  },
  pricePerDay: {
    type: Number,
    required: true
  },
  depositAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'verified', 'rented', 'rejected', 'unavailable', 'maintenance'],
    default: 'pending_approval'
  },
  images: [{
    type: String
  }],
  videos: [{
    type: String
  }],
  specs: {
    type: Map,
    of: String,
    default: {}
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationNotes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Asset', assetSchema);
