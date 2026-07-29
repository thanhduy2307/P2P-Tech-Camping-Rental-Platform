const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
  lender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  bankAccount: {
    accountNumber: { type: String, required: true },
    bankName: { type: String, required: true },
    accountHolder: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectReason: {
    type: String,
    default: ''
  },
  adminTransferInfo: {
    bankName: { type: String },
    accountNumber: { type: String },
    accountHolder: { type: String }
  },
  transactionReference: {
    type: String,
    default: ''
  },
  transferReceiptImage: {
    type: String,
    default: ''
  },
  transferredAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
