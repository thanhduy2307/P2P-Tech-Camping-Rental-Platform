const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['deduction', 'addition'],
    required: true
  },
  reason: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
