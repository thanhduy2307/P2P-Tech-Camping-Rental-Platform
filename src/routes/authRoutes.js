const express = require('express');
const {
  register,
  verifyOtp,
  forgotPasswordRequest,
  forgotPasswordReset,
  login,
  googleCallback,
  googleStartMobile,
  googlePollSession,
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
  getMyTransactions,
  forgotPassword,
  resetPassword,
  getLenderStats
} = require('../controllers/authController');
const { runIntegrationTests } = require('../controllers/testController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/test-features', runIntegrationTests);
router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPasswordRequest);
router.post('/reset-password', forgotPasswordReset);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/google/start-mobile', googleStartMobile);
router.get('/google/session/:sessionId', googlePollSession);
router.get('/google/callback', googleCallback);
router.get('/me', protect, getMe);
router.put('/switch-role', protect, switchRole);
router.put('/complete-profile', protect, completeProfile);
router.put('/update-avatar', protect, updateAvatar);
router.get('/balance', protect, authorize('renter', 'lender'), getBalance);
router.get('/lender-stats', protect, authorize('renter', 'lender'), getLenderStats);

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
