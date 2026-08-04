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
      specs,
      serialNumber,
      invoiceImage,
      warrantyCardImage
    } = req.body;

    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tọa độ vị trí (latitude, longitude) cho thiết bị.' });
    }

    // Validate images count (at least 5 images)
    if (!images || !Array.isArray(images) || images.length < 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bạn bắt buộc phải đăng tải tối thiểu 5 ảnh sản phẩm (4 ảnh các góc + 1 ảnh chụp rõ số Serial trên thân máy hoặc ảnh lều thực tế).' 
      });
    }

    // Validate originalPrice
    if (!originalPrice || typeof originalPrice !== 'number' || originalPrice <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng khai báo giá trị mua mới gốc của thiết bị (originalPrice) lớn hơn 0.' 
      });
    }



    // 1. Giới hạn xếp hàng (Queue Limit)
    // Một Lender mới (chưa có điểm uy tín cao) chỉ được đăng tối đa 3 thiết bị ở trạng thái chờ duyệt cùng một lúc.
    const isHighReputation = req.user.reputationScore >= 4.8 && (req.user.ratingsReceived || []).length >= 3;
    if (!isHighReputation) {
      const pendingCount = await Asset.countDocuments({ lender: req.user._id, status: 'pending_approval' });
      if (pendingCount >= 3) {
        return res.status(400).json({ 
          success: false, 
          message: 'Một Lender mới (chưa có điểm uy tín cao) chỉ được đăng tối đa 3 thiết bị ở trạng thái chờ duyệt cùng một lúc. Điều này để tránh tình trạng spam làm nghẽn hệ thống kiểm định.' 
        });
      }
    }

    // 4. AI Metadata Extraction & Content Moderation (Anti-Fraud & NSFW Check)
    // Tạm thời tắt tính năng AI check khi up sản phẩm của lender theo yêu cầu
    /*
    const scanResult = await aiService.scanImageForFraud(images[0]);
    if (scanResult.isCopied) {
      return res.status(400).json({
        success: false,
        message: `Đăng ký thiết bị bị từ chối do phát hiện hình ảnh không hợp lệ (Gian lận hoặc Nhạy cảm). Lý do AI: ${scanResult.reason}`
      });
    }
    */
    const scanResult = { isCopied: false, reason: 'AI Check Disabled' };

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

      invoiceImage: invoiceImage || '',
      warrantyCardImage: warrantyCardImage || '',
      aiAntiFraudStatus: {
        isCopied: scanResult.isCopied,
        reason: scanResult.reason,
        scannedAt: new Date()
      },
      location: {
        lat: location.lat,
        lng: location.lng,
        addressString: location.addressString || ''
      },
      status: 'pending_approval'
    });

    let isHighValue = originalPrice > 20000000; // > 20 million VND
    let assignedTask = null;
    let closestInspector = null;
    let feedbackMessage = '';

    if (isHighValue) {
      // High value asset: Needs manual inspector assignment
      const inspectors = await User.find({ role: 'inspector' });
      let minDistance = Infinity;

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
        feedbackMessage = `Đăng thiết bị VIP thành công! Do tài sản có giá trị cao, hệ thống đã phân bổ nhiệm vụ kiểm duyệt trực tiếp cho Inspector: ${closestInspector.name} (Khoảng cách: ${assignedTask.distance} km).`;
      } else {
        feedbackMessage = 'Đăng thiết bị VIP thành công. Tuy nhiên chưa có Inspector nào hoạt động để phân bổ nhiệm vụ kiểm duyệt trực tiếp.';
      }
    } else {
      // Everyday asset: AI Auto-Approval
      if (!scanResult.isCopied) {
        asset.status = 'verified';
        await asset.save();
        feedbackMessage = `Đăng thiết bị thành công! Tài sản của bạn đã được AI tự động duyệt (Auto-Approved) và hiển thị ngay lập tức. Cám ơn bạn đã tuân thủ quy định đăng bài!`;
      } else {
        feedbackMessage = `Đăng thiết bị thành công! Do hệ thống AI phát hiện nghi vấn hình ảnh, tài sản đang chờ duyệt thủ công.`;
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
    const { status, verificationNotes, inspectionChecklist } = req.body; // status can be 'verified', 'rejected' or 'unavailable'

    if (!['verified', 'rejected', 'unavailable'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái kiểm duyệt không hợp lệ. Phải là "verified", "rejected" hoặc "unavailable".' });
    }

    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Lấy nhiệm vụ được giao tương ứng
    const task = await InspectorTask.findOne({ asset: asset._id, status: 'assigned' });

    if (status === 'verified') {
      if (task && !task.isRemote) {
        // Bắt buộc checklist cho luồng Offline
        if (!inspectionChecklist) {
          return res.status(400).json({ 
            success: false, 
            message: 'Vui lòng hoàn thành và gửi Biên bản kiểm định thực tế (Checklist Thẩm định).' 
          });
        }

        if (asset.category === 'Tech') {
          const { shutterCountTest, deadPixelSensorCheck, lensMoldCheck } = inspectionChecklist;
          if (shutterCountTest === undefined || deadPixelSensorCheck === undefined || lensMoldCheck === undefined) {
            return res.status(400).json({ 
              success: false, 
              message: 'Đối với đồ Công Nghệ giá trị cao, vui lòng hoàn tất đủ checklist: Số shot, Chết pixel cảm biến, và Mốc rễ tre lens.' 
            });
          }
        } else if (asset.category === 'Camping') {
          const { zipperWearCheck, frameElasticityCheck, tentHolesCheck } = inspectionChecklist;
          if (zipperWearCheck === undefined || frameElasticityCheck === undefined || tentHolesCheck === undefined) {
            return res.status(400).json({ 
              success: false, 
              message: 'Đối với đồ Cắm Trại giá trị cao, vui lòng hoàn tất đủ checklist: Độ mòn khóa kéo, Đàn hồi khung nhôm, và Lỗ thủng màng chống muỗi.' 
            });
          }
        }
        asset.inspectionChecklist = inspectionChecklist;
      }

      // Cấp nhãn uy tín dựa trên luồng duyệt
      const isRemote = task ? task.isRemote : true;
      asset.badges = isRemote ? ["Chính chủ 100%"] : ["Đã kiểm định tận nơi", "Chính chủ 100%"];
    } else {
      // Nếu bị Rejected hoặc Unavailable, thu hồi nhãn
      asset.badges = [];
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
      message: status === 'verified' 
        ? 'Phê duyệt thiết bị thành công! Đã cấp nhãn uy tín tương ứng.'
        : 'Từ chối duyệt thiết bị thành công. Lý do từ chối đã được gửi đến Lender.',
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

// @desc    Update an asset (with lock modification rule)
// @route   PUT /api/assets/:id
// @access  Private (Lender only)
exports.updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị.' });
    }

    // Check ownership
    if (asset.lender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa thiết bị này.' });
    }

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
      specs,
      serialNumber,
      invoiceImage,
      warrantyCardImage
    } = req.body;

    // Validate images count if updated
    if (images !== undefined) {
      if (!images || !Array.isArray(images) || images.length < 5) {
        return res.status(400).json({ 
          success: false, 
          message: 'Bạn bắt buộc phải đăng tải tối thiểu 5 ảnh sản phẩm (4 ảnh các góc + 1 ảnh chụp rõ số Serial hoặc ảnh lều thực tế).' 
        });
      }
    }


    // Let's compute the new deposit amount if needed
    let finalDepositAmount = depositAmount !== undefined ? depositAmount : asset.depositAmount;
    const checkOriginalPrice = originalPrice !== undefined ? originalPrice : asset.originalPrice;
    const checkPurchaseYear = purchaseYear !== undefined ? purchaseYear : asset.purchaseYear;
    const checkConditionRate = itemConditionRate !== undefined ? itemConditionRate : asset.itemConditionRate;

    if (depositCalculationMode === 'auto' || (depositCalculationMode === undefined && asset.depositCalculationMode === 'auto')) {
      if (!checkOriginalPrice || !checkPurchaseYear || !checkConditionRate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Khi chọn tính tiền đặt cọc tự động (auto), vui lòng cung cấp đầy đủ thông tin: Giá gốc, Năm mua, và Độ mới (%).' 
        });
      }
      const currentYear = new Date().getFullYear();
      const age = Math.max(0, currentYear - checkPurchaseYear);
      const depreciationFactor = Math.max(0.5, 1 - (age * 0.1));
      const conditionFactor = Math.min(100, Math.max(0, checkConditionRate)) / 100;
      finalDepositAmount = Math.round(checkOriginalPrice * conditionFactor * depreciationFactor);
    } else {
      if (depositAmount !== undefined && (typeof depositAmount !== 'number' || depositAmount < 0)) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp số tiền đặt cọc hợp lệ.' });
      }
    }

    // Check Lock Modification Rule if currently verified
    let triggerReInspection = false;
    let downgradeReason = '';

    if (asset.status === 'verified') {
      const isNameChanged = name !== undefined && name !== asset.name;
      const isDepositChanged = finalDepositAmount !== asset.depositAmount;
      const isOriginalPriceChanged = originalPrice !== undefined && originalPrice !== asset.originalPrice;
      const isPrimaryImageChanged = images && images[0] !== asset.images[0];

      if (isNameChanged || isDepositChanged || isOriginalPriceChanged || isPrimaryImageChanged) {
        triggerReInspection = true;
        downgradeReason = 'Thiết bị bị tự động khóa và chuyển về trạng thái chờ duyệt do Lender thay đổi thông tin cốt lõi (Tên, Giá cọc, Ảnh chính) sau khi đã kiểm định.';
      }
    } else if (asset.status === 'rejected') {
      // If previously rejected, any edits should bring it back to pending_approval for re-inspection
      triggerReInspection = true;
      downgradeReason = 'Thiết bị được nộp lại hồ sơ chỉnh sửa từ Lender.';
    }

    // Update fields
    if (name !== undefined) asset.name = name;
    if (description !== undefined) asset.description = description;
    if (category !== undefined) asset.category = category;
    if (condition !== undefined) asset.condition = condition;
    if (pricePerDay !== undefined) asset.pricePerDay = pricePerDay;
    asset.depositAmount = finalDepositAmount;
    if (depositCalculationMode !== undefined) asset.depositCalculationMode = depositCalculationMode;
    if (originalPrice !== undefined) asset.originalPrice = originalPrice;
    if (purchaseYear !== undefined) asset.purchaseYear = purchaseYear;
    if (itemConditionRate !== undefined) asset.itemConditionRate = itemConditionRate;
    if (images !== undefined) asset.images = images;
    if (videos !== undefined) asset.videos = videos;
    if (specs !== undefined) asset.specs = specs;

    if (invoiceImage !== undefined) asset.invoiceImage = invoiceImage;
    if (warrantyCardImage !== undefined) asset.warrantyCardImage = warrantyCardImage;
    if (location !== undefined) {
      asset.location = {
        lat: location.lat,
        lng: location.lng,
        addressString: location.addressString || asset.location.addressString || ''
      };
    }

    if (triggerReInspection) {
      asset.status = 'pending_approval';
      asset.verificationNotes = downgradeReason;
      asset.badges = []; // Clear badges
    }

    await asset.save();

    // If reinspection is triggered, re-assign inspector and create task
    if (triggerReInspection) {
      // Deactivate any existing active tasks for this asset
      await InspectorTask.updateMany(
        { asset: asset._id, status: 'assigned' },
        { status: 'cancelled' }
      );

      // Re-assign Inspector
      const inspectors = await User.find({ role: 'inspector' });
      let assignedTask = null;
      let closestInspector = null;
      let minDistance = Infinity;
      let isHighValue = (originalPrice !== undefined ? originalPrice : asset.originalPrice) > 20000000;
      const assetLat = location ? location.lat : asset.location.lat;
      const assetLng = location ? location.lng : asset.location.lng;

      if (isHighValue) {
        for (const inspector of inspectors) {
          if (
            inspector.address &&
            inspector.address.coordinates &&
            typeof inspector.address.coordinates.lat === 'number' &&
            typeof inspector.address.coordinates.lng === 'number' &&
            inspector.address.coordinates.lat !== 0
          ) {
            const dist = getDistance(
              assetLat,
              assetLng,
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
        if (inspectors.length > 0) {
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
    }

    res.status(200).json({
      success: true,
      message: triggerReInspection 
        ? 'Cập nhật thiết bị thành công. Thiết bị đã được chuyển về trạng thái chờ duyệt lại.' 
        : 'Cập nhật thiết bị thành công.',
      data: asset
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an asset (Soft Delete)
// @route   DELETE /api/assets/:id
// @access  Private (Lender)
exports.deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
    }

    if (asset.lender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa thiết bị này' });
    }

    // Check if asset is involved in any active/reserved orders
    const Order = require('../models/Order');
    const activeOrders = await Order.countDocuments({
      asset: asset._id,
      status: { $in: ['pending_payment', 'reserved', 'active', 'disputed'] }
    });

    if (activeOrders > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể xóa thiết bị đang trong quá trình thuê hoặc có tranh chấp.' 
      });
    }

    // Soft delete using updateOne to bypass any strict schema validation
    await Asset.updateOne({ _id: asset._id }, { $set: { status: 'deleted' } });

    res.status(200).json({ success: true, message: 'Đã xóa thiết bị thành công.' });
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
    const { query, lat, lng, addressString } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập nhu cầu cắm trại dã ngoại của bạn.' });
    }

    // Get all verified assets to match against
    const availableAssets = await Asset.find({ status: 'verified' });

    const location = (lat != null && lng != null) ? { lat: parseFloat(lat), lng: parseFloat(lng), addressString: addressString || '' } : null;
    const aiRecommendation = await aiService.generateCampingRecommendation(query, availableAssets, location);

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
    
    // Fetch reviews from orders (Renter ratings/comments)
    const Order = require('../models/Order');
    const reviews = await Order.find({ 
      asset: req.params.id, 
      lenderRating: { $exists: true, $ne: null } 
    })
    .populate('renter', 'name avatar')
    .select('lenderRating lenderComment createdAt');

    const assetObj = asset.toObject();
    assetObj.reviews = reviews || [];

    // Fetch rented dates (active or reserved orders)
    const rentedOrders = await Order.find({
      asset: req.params.id,
      status: { $in: ['reserved', 'active'] }
    }).select('startDate endDate');
    
    assetObj.rentedDates = rentedOrders.map(order => {
      const bufferedEndDate = new Date(order.endDate);
      bufferedEndDate.setDate(bufferedEndDate.getDate() + 1); // 1-day buffer time
      return {
        startDate: order.startDate,
        endDate: bufferedEndDate
      };
    });

    res.status(200).json({ success: true, data: assetObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current lender's assets
// @route   GET /api/assets/my
// @access  Private (Lender)
exports.getMyAssets = async (req, res) => {
  try {
    const assets = await Asset.find({ lender: req.user._id, status: { $ne: 'deleted' } }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: assets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Manage manual blocked dates for an asset
// @route   PUT /api/assets/:id/block-dates
// @access  Private (Lender)
exports.manageBlockedDates = async (req, res) => {
  try {
    const { blockedDates } = req.body;
    
    if (!Array.isArray(blockedDates)) {
      return res.status(400).json({ success: false, message: 'blockedDates phải là một mảng.' });
    }

    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị.' });
    }

    if (asset.lender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa thiết bị này.' });
    }

    // Filter to ensure proper format and keep reason as 'manual'
    const formattedDates = blockedDates.map(dateObj => ({
      startDate: new Date(dateObj.startDate),
      endDate: new Date(dateObj.endDate),
      reason: 'manual'
    }));

    asset.blockedDates = formattedDates;
    await asset.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật lịch bận thủ công thành công.',
      data: asset.blockedDates
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

