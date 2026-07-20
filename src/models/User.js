const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  avatar: {
    type: String,
    default: ''
  },
  coverImage: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    required: false
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  role: {
    type: String,
    enum: ['renter', 'lender', 'inspector', 'admin'],
    required: true
  },
  balance: {
    type: Number,
    default: 0 // Used to track funds for Lender payouts
  },
  phoneNumber: {
    type: String,
    default: '',
    sparse: true,
    index: true
  },
  address: {
    province: { type: String, default: '' },
    district: { type: String, default: '' },
    ward: { type: String, default: '' },
    street: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    }
  },
  isProfileCompleted: {
    type: Boolean,
    default: false
  },
  renterStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  renterOnboarding: {
    cccdFront: { type: String, default: '' },
    cccdBack: { type: String, default: '' },
    cccdSelfie: { type: String, default: '' },
    rejectReason: { type: String, default: '' }
  },
  lenderStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  lenderOnboarding: {
    cccdFront: { type: String, default: '' },
    cccdBack: { type: String, default: '' },
    cccdSelfie: { type: String, default: '' },
    bankAccount: {
      accountNumber: { type: String, default: '' },
      bankName: { type: String, default: '' },
      accountHolder: { type: String, default: '' }
    },
    rejectReason: { type: String, default: '' }
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  phoneVerificationOtp: {
    type: String
  },
  phoneVerificationOtpExpires: {
    type: Date
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  reputationScore: {
    type: Number,
    default: 5.0
  },
  ratingsReceived: [{
    type: Number
  }],
  bankAccount: {
    accountNumber: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountHolder: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
