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
    enum: ['draft', 'pending_approval', 'verified', 'rented', 'rejected', 'unavailable', 'maintenance', 'deleted'],
    default: 'pending_approval'
  },
  images: [{
    type: String
  }],
  videos: [{
    type: String
  }],
  serialNumber: {
    type: String,
    default: ''
  },
  invoiceImage: {
    type: String,
    default: ''
  },
  warrantyCardImage: {
    type: String,
    default: ''
  },
  badges: [{
    type: String,
    default: []
  }],
  aiAntiFraudStatus: {
    isCopied: { type: Boolean, default: false },
    reason: { type: String, default: '' },
    scannedAt: { type: Date }
  },
  inspectionChecklist: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  specs: {
    type: Map,
    of: String,
    default: {}
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    addressString: { type: String, default: '' }
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationNotes: {
    type: String
  },
  blockedDates: [{
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, enum: ['manual', 'rented'], default: 'manual' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Asset', assetSchema);
