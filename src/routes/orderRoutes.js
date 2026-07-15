const express = require('express');
const {
  createOrder,
  vnpayReturn,
  confirmHandover,
  confirmReturn,
  settleOrder,
  raiseDispute,
  respondDispute,
  resolveDispute,
  cancelOrder,
  requestExtension,
  approveExtension,
  submitRating,
  getContract,
  getMyRentals,
  getIncomingOrders,
  getPaymentUrl,
  getDisputedOrders,
  uploadRenterHandoverImages,
  uploadRenterReturnImages,
  requestRenterDeductionConfirmation,
  acceptDeduction
} = require('../controllers/orderController');
const { protect, authorize, checkProfileCompleted, checkRenterVerified } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, authorize('renter'), checkProfileCompleted, checkRenterVerified, createOrder);
router.get('/vnpay_return', vnpayReturn); // Public endpoint for VNPay callback

router.get('/my-rentals', protect, getMyRentals);
router.get('/incoming', protect, authorize('lender'), getIncomingOrders);
router.get('/disputed', protect, authorize('admin', 'inspector'), getDisputedOrders);

router.put('/:id/handover', protect, authorize('renter', 'lender'), confirmHandover);
router.put('/:id/renter-handover-images', protect, authorize('renter'), uploadRenterHandoverImages);
router.put('/:id/return', protect, authorize('lender'), confirmReturn);
router.put('/:id/renter-return-images', protect, authorize('renter'), uploadRenterReturnImages);
router.put('/:id/settle', protect, authorize('admin'), settleOrder);
router.put('/:id/dispute', protect, authorize('renter', 'lender'), raiseDispute);
router.put('/:id/dispute-respond', protect, authorize('renter'), respondDispute);
router.put('/:id/resolve-dispute', protect, authorize('admin', 'inspector'), resolveDispute);
router.put('/:id/dispute-request-confirmation', protect, authorize('admin', 'inspector'), requestRenterDeductionConfirmation);
router.put('/:id/accept-deduction', protect, authorize('renter'), acceptDeduction);

// New Advanced Core Routes
router.put('/:id/cancel', protect, authorize('renter', 'lender'), cancelOrder);
router.post('/:id/extend', protect, authorize('renter'), requestExtension);
router.put('/:id/extend/approve', protect, authorize('lender'), approveExtension);
router.post('/:id/rate', protect, authorize('renter', 'lender'), submitRating);
router.get('/:id/contract', protect, authorize('renter', 'lender'), getContract);
router.get('/:id/pay', protect, authorize('renter'), getPaymentUrl);

module.exports = router;
