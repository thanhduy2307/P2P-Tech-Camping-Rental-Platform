const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  renter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  rentalDays: {
    type: Number,
    required: true
  },
  totalRent: {
    type: Number,
    required: true
  },
  deposit: {
    type: Number,
    required: true
  },
  platformFee: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending_payment', 'reserved', 'active', 'returned', 'completed', 'disputed'],
    default: 'pending_payment'
  },
  vnpayTxnRef: {
    type: String
  },
  handoverOTP: {
    type: String,
    default: ''
  },
  returnOTP: {
    type: String,
    default: ''
  },
  disputeNotes: {
    type: String
  },
  inspector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  handoverImages: [{
    type: String
  }],
  returnImages: [{
    type: String
  }],
  extensionDays: {
    type: Number,
    default: 0
  },
  extensionRent: {
    type: Number,
    default: 0
  },
  extensionStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  contractPdfUrl: {
    type: String,
    default: ''
  },
  renterRating: {
    type: Number
  },
  renterComment: {
    type: String
  },
  lenderRating: {
    type: Number
  },
  lenderComment: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
