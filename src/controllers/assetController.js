const Asset = require('../models/Asset');
const User = require('../models/User');
const InspectorTask = require('../models/InspectorTask');
const aiService = require('../services/aiService');

// Helper to calculate distance in km using the Haversine trigonometric formula
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

exports.createAsset = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      category, 
      condition, 
      pricePerDay, 
      depositAmount, 
      images, 
      videos, 
      location,
      originalPrice,
      purchaseYear,
      itemConditionRate,
      depositCalculationMode,
      specs
    } = req.body;

    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tọa độ vị trí (latitude, longitude) cho thiết bị.' });
    }

    let finalDepositAmount = depositAmount;
    if (depositCalculationMode === 'auto') {
      if (!originalPrice || !purchaseYear || !itemConditionRate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Khi chọn tính tiền đặt cọc tự động (auto), vui lòng cung cấp đầy đủ thông tin: Giá gốc (originalPrice), Năm mua (purchaseYear), và Độ mới (itemConditionRate).' 
        });
      }
      const currentYear = new Date().getFullYear();
      const age = Math.max(0, currentYear - purchaseYear);
      const depreciationFactor = Math.max(0.5, 1 - (age * 0.1)); // Giảm 10% mỗi năm, tối đa 50%
      const conditionFactor = Math.min(100, Math.max(0, itemConditionRate)) / 100;
      finalDepositAmount = Math.round(originalPrice * conditionFactor * depreciationFactor);
    } else {
      if (typeof finalDepositAmount !== 'number' || finalDepositAmount < 0) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp số tiền đặt cọc hợp lệ.' });
      }
    }

    const asset = await Asset.create({
      lender: req.user._id,
      name,
      description,
      category,
      condition,
      originalPrice,
      purchaseYear,
      itemConditionRate,
      depositCalculationMode: depositCalculationMode || 'fixed',
      pricePerDay,
      depositAmount: finalDepositAmount,
      images: images || [],
      videos: videos || [],
      specs: specs || {},
      location: {
        lat: location.lat,
        lng: location.lng
      },
      status: 'pending_approval'
    });

    // 1. Query all inspectors
    const inspectors = await User.find({ role: 'inspector' });

    let assignedTask = null;
    let closestInspector = null;
    let minDistance = Infinity;
    let isHighValue = depositAmount >= 2000000;

    if (isHighValue) {
      // High value asset: In-person check by the closest inspector (Haversine Geolocation)
      for (const inspector of inspectors) {
        if (
          inspector.address &&
          inspector.address.coordinates &&
          typeof inspector.address.coordinates.lat === 'number' &&
          typeof inspector.address.coordinates.lng === 'number' &&
          inspector.address.coordinates.lat !== 0
        ) {
          const dist = getDistance(
            location.lat,
            location.lng,
            inspector.address.coordinates.lat,
            inspector.address.coordinates.lng
          );

          if (dist < minDistance) {
            minDistance = dist;
            closestInspector = inspector;
          }
        }
      }

      if (closestInspector) {
        assignedTask = await InspectorTask.create({
          asset: asset._id,
          inspector: closestInspector._id,
          status: 'assigned',
          isRemote: false,
          distance: Math.round(minDistance * 100) / 100
        });
      }
    } else {
      // Low value asset: Remote/online inspection via images & videos
      if (inspectors.length > 0) {
        // Assign to the first available inspector for online review
        closestInspector = inspectors[0];
        assignedTask = await InspectorTask.create({
          asset: asset._id,
          inspector: closestInspector._id,
          status: 'assigned',
          isRemote: true,
          distance: 0
        });
      }
    }

    let feedbackMessage = 'Tạo tài sản thành công. Tuy nhiên chưa có Inspector nào hoạt động để phân bổ nhiệm vụ kiểm duyệt.';
    if (assignedTask) {
      if (isHighValue) {
        feedbackMessage = `Đăng thiết bị giá trị cao thành công! Đã tự động phân bổ nhiệm vụ kiểm duyệt TRỰC TIẾP tận nơi cho Inspector gần nhất: ${closestInspector.name} (Khoảng cách: ${assignedTask.distance} km).`;
      } else {
        feedbackMessage = `Đăng thiết bị giá trị nhỏ thành công! Hệ thống đã lập đơn kiểm duyệt TỪ XA (Online) qua ảnh và video. Giao nhiệm vụ cho Inspector: ${closestInspector.name}.`;
      }
    }

    res.status(201).json({
      success: true,
      message: feedbackMessage,
      data: asset,
      assignedTask
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all verified assets (for Renters to browse)
// @route   GET /api/assets
// @access  Public
exports.getVerifiedAssets = async (req, res) => {
  try {
    const assets = await Asset.find({ status: 'verified' }).populate('lender', 'name');
    
    const { lat, lng } = req.query;

    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      if (isNaN(userLat) || isNaN(userLng)) {
        return res.status(400).json({ success: false, message: 'Tọa độ kinh độ và vĩ độ không hợp lệ.' });
      }

      // Calculate distance for each asset and sort
      const assetsWithDistance = assets.map((asset) => {
        let distance = null;
        if (asset.location && typeof asset.location.lat === 'number' && typeof asset.location.lng === 'number') {
          distance = getDistance(userLat, userLng, asset.location.lat, asset.location.lng);
          distance = Math.round(distance * 100) / 100; // rounded to 2 decimals
        }
        
        // Convert Mongoose document to plain JS object to add field
        const assetObj = asset.toObject();
        assetObj.distance = distance;
        return assetObj;
      });

      // Sort by distance (assets without distance go to the end)
      assetsWithDistance.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });

      return res.status(200).json({ success: true, data: assetsWithDistance });
    }

    res.status(200).json({ success: true, data: assets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all pending assets
// @route   GET /api/assets/pending
// @access  Private (Inspector only)
exports.getPendingAssets = async (req, res) => {
  try {
    const tasks = await InspectorTask.find({ 
      inspector: req.user._id,
      status: 'assigned'
    }).populate({
      path: 'asset',
      populate: { path: 'lender', select: 'name email phoneNumber' }
    });

    const assets = tasks
      .filter(t => t.asset !== null)
      .map(t => {
        const assetObj = t.asset.toObject();
        return {
          ...assetObj,
          taskDetails: {
            taskId: t._id,
            isRemote: t.isRemote,
            distance: t.distance,
            assignedAt: t.createdAt
          }
        };
      });

    res.status(200).json({ success: true, data: assets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify an asset
// @route   PUT /api/assets/:id/verify
// @access  Private (Inspector only)
exports.verifyAsset = async (req, res) => {
  try {
    const { status, verificationNotes } = req.body; // status can be 'verified', 'rejected' or 'unavailable'

    if (!['verified', 'rejected', 'unavailable'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái kiểm duyệt không hợp lệ. Phải là "verified", "rejected" hoặc "unavailable".' });
    }

    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    asset.status = status;
    asset.verifiedBy = req.user._id;
    asset.verificationNotes = verificationNotes || asset.verificationNotes;

    await asset.save();

    // Complete the corresponding InspectorTask to 'completed'
    await InspectorTask.updateMany(
      { asset: asset._id, status: 'assigned' },
      { status: 'completed' }
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái kiểm duyệt tài sản và hoàn thành nhiệm vụ thành công.',
      data: asset
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Lender toggles status to 'verified', 'unavailable', or 'maintenance'
// @route   PUT /api/assets/:id/status
// @access  Private (Lender)
exports.updateAssetStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['verified', 'unavailable', 'maintenance'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ. Phải là "verified", "unavailable", hoặc "maintenance".' });
    }

    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị.' });
    }

    // Check ownership
    if (asset.lender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thay đổi trạng thái của thiết bị này.' });
    }

    // If active rents exist, warn Lender but update is allowed
    asset.status = status;
    await asset.save();

    res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái thiết bị thành công sang: ${status}`,
      data: asset
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    AI-assisted Deposit & Price Estimation (Lender)
// @route   POST /api/assets/ai-estimate-deposit
// @access  Private (Lender)
exports.aiEstimateDeposit = async (req, res) => {
  try {
    const { name, description, originalPrice, purchaseYear, itemConditionRate } = req.body;

    if (!name || !originalPrice || !purchaseYear || !itemConditionRate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp tên thiết bị, giá gốc, năm mua và độ mới (%) để ước tính.' 
      });
    }

    const estimation = await aiService.estimateDepositAndPrice(
      name,
      description || '',
      originalPrice,
      purchaseYear,
      itemConditionRate
    );

    res.status(200).json({
      success: true,
      data: estimation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Recommend camping equipment based on trip description (AI Search)
// @route   POST /api/assets/recommend
// @access  Public / Renter
exports.recommendAssetsByNeed = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập nhu cầu cắm trại dã ngoại của bạn.' });
    }

    // Get all verified assets to match against
    const availableAssets = await Asset.find({ status: 'verified' });

    const aiRecommendation = await aiService.generateCampingRecommendation(query, availableAssets);

    // Populate the recommended assets from database using the IDs returned by AI
    let recommendedAssets = [];
    if (aiRecommendation.recommendedAssetIds && aiRecommendation.recommendedAssetIds.length > 0) {
      // Find matching assets and populate lender name
      recommendedAssets = await Asset.find({
        _id: { $in: aiRecommendation.recommendedAssetIds },
        status: 'verified'
      }).populate('lender', 'name');
    }

    res.status(200).json({
      success: true,
      data: {
        recommendations: aiRecommendation.recommendations,
        suggestedPlan: aiRecommendation.suggestedPlan,
        assets: recommendedAssets,
        aiSource: aiRecommendation.aiSource || "Unknown"
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get asset by ID
// @route   GET /api/assets/:id
// @access  Public
exports.getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).populate('lender', 'name email address lenderStatus avatar');
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị.' });
    }
    res.status(200).json({ success: true, data: asset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current lender's assets
// @route   GET /api/assets/my
// @access  Private (Lender)
exports.getMyAssets = async (req, res) => {
  try {
    const assets = await Asset.find({ lender: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: assets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

