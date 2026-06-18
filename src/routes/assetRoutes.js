const express = require('express');
const { 
  createAsset, 
  getVerifiedAssets, 
  getPendingAssets, 
  verifyAsset, 
  updateAssetStatus,
  aiEstimateDeposit,
  recommendAssetsByNeed,
  getAssetById,
  getMyAssets
} = require('../controllers/assetController');
const { protect, authorize, checkLenderPermission } = require('../middleware/auth');

const router = express.Router();

router.post('/recommend', recommendAssetsByNeed);
router.post('/ai-estimate-deposit', protect, authorize('lender'), checkLenderPermission, aiEstimateDeposit);

router.route('/')
  .post(protect, authorize('lender'), checkLenderPermission, createAsset)
  .get(getVerifiedAssets);

router.get('/pending', protect, authorize('inspector'), getPendingAssets);
router.get('/my', protect, authorize('lender'), getMyAssets);

router.put('/:id/verify', protect, authorize('inspector'), verifyAsset);

// New Asset Availability/Maintenance control route
router.put('/:id/status', protect, authorize('lender'), updateAssetStatus);

router.get('/:id', getAssetById);

module.exports = router;
