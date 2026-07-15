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
    enum: ['pending_payment', 'reserved', 'active', 'returned', 'completed', 'disputed', 'cancelled'],
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
  renterHandoverImages: [{
    type: String
  }],
  renterReturnImages: [{
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
  isLateReturn: {
    type: Boolean,
    default: false
  },
  lateDays: {
    type: Number,
    default: 0
  },
  lateFee: {
    type: Number,
    default: 0
  },
  contractPdfUrl: {
    type: String,
    default: ''
  },
  depositMethod: {
    type: String,
    enum: ['online', 'cash'],
    default: 'online'
  },
  isCashDepositHandedOver: {
    type: Boolean,
    default: false
  },
  isCashDepositReturned: {
    type: Boolean,
    default: false
  },
  actualCashDepositReturned: {
    type: Number,
    default: 0
  },
  cashDepositDeductionReason: {
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
  },
  disputeCreator: {
    type: String,
    enum: ['renter', 'lender', '']
  },
  disputeType: {
    type: String,
    enum: ['quality_issue', 'damage_issue', '']
  },
  requestedDeductionAmount: {
    type: Number,
    default: 0
  },
  renterDisputeNotes: {
    type: String
  },
  renterDisputeImages: [{
    type: String
  }],
  disputeStatus: {
    type: String,
    enum: ['open', 'inspector_reviewed', 'responded', 'resolved', '']
  },
  deductionConfirmedByRenter: {
    type: Boolean,
    default: false
  },
  repairQuotationImages: [{
    type: String
  }],
  disputedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
