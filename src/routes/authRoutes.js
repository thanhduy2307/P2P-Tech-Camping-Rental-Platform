const express = require('express');
const {
  register,
  registerPhone,
  verifyOtp,
  login,
  googleCallback,
  switchRole,
  completeProfile,
  applyLender,
  getLenderApplications,
  verifyLenderApplication,
  getBalance,
  createWithdrawal,
  getWithdrawals,
  verifyWithdrawal,
  getPublicProfile,
  getMe,
  getMyWithdrawals,
  updateAvatar,
  applyRenterEkyc,
  getRenterApplications,
  verifyRenterApplication,
  updatePublicProfileInfo,
  getMyTransactions
} = require('../controllers/authController');
const { runIntegrationTests } = require('../controllers/testController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/test-features', runIntegrationTests);
router.post('/register', register);
router.post('/register-phone', registerPhone);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.get('/google/callback', googleCallback);
router.get('/me', protect, getMe);
router.put('/switch-role', protect, switchRole);
router.put('/complete-profile', protect, completeProfile);
router.put('/update-avatar', protect, updateAvatar);
router.get('/balance', protect, authorize('renter', 'lender'), getBalance);

// Public User profile (Personal page summary)
router.get('/users/:id/profile', getPublicProfile);
router.put('/users/profile', protect, updatePublicProfileInfo);

// Renter eKYC onboarding
router.post('/renter-onboarding', protect, authorize('renter'), applyRenterEkyc);
router.get('/renter-applications', protect, authorize('admin'), getRenterApplications);
router.put('/renter-applications/:id/verify', protect, authorize('admin'), verifyRenterApplication);

// Lender eKYC onboarding
router.post('/lender-onboarding', protect, authorize('renter'), applyLender);
router.get('/lender-applications', protect, authorize('admin'), getLenderApplications);
router.put('/lender-applications/:id/verify', protect, authorize('admin'), verifyLenderApplication);

// Wallet & Withdrawals
router.post('/withdraw', protect, authorize('renter', 'lender'), createWithdrawal);
router.get('/my-withdrawals', protect, authorize('renter', 'lender'), getMyWithdrawals);
router.get('/my-transactions', protect, authorize('renter', 'lender'), getMyTransactions);
router.get('/withdrawals', protect, authorize('admin'), getWithdrawals);
router.put('/withdrawals/:id/verify', protect, authorize('admin'), verifyWithdrawal);

module.exports = router;
