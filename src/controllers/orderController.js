const Order = require('../models/Order');
const Asset = require('../models/Asset');
const User = require('../models/User');
const { createPaymentUrl, verifyReturnUrl } = require('../services/vnpayService');
const { differenceInDays, parseISO } = require('date-fns');

// @desc    Create a new order & generate VNPay URL
// @route   POST /api/orders
// @access  Private (Renter)
exports.createOrder = async (req, res) => {
  try {
    const { assetId, startDate, endDate } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    if (asset.status !== 'verified') {
      return res.status(400).json({ success: false, message: 'Asset is not available for rent' });
    }

    // Check if renting own asset
    if (asset.lender.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Bạn không thể tự đặt thuê tài sản của chính mình.' });
    }

    // Check availability
    const overlappingOrders = await Order.find({
      asset: assetId,
      status: { $in: ['reserved', 'active'] },
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
      ]
    });

    if (overlappingOrders.length > 0) {
      return res.status(400).json({ success: false, message: 'Asset is already booked for these dates' });
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const rentalDays = differenceInDays(end, start);

    if (rentalDays <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid dates' });
    }

    const totalRent = rentalDays * asset.pricePerDay;
    
    // Apply 20% deposit discount for high reputation Renter (reputationScore >= 4.8)
    let deposit = asset.depositAmount;
    if (req.user && req.user.reputationScore >= 4.8) {
      deposit = Math.round(deposit * 0.8);
    }
    
    const totalAmount = totalRent + deposit;

    const handoverOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const returnOTP = Math.floor(100000 + Math.random() * 900000).toString();

    const order = await Order.create({
      asset: assetId,
      renter: req.user._id,
      startDate,
      endDate,
      rentalDays,
      totalRent,
      deposit,
      handoverOTP,
      returnOTP,
      status: 'pending_payment'
    });

    const paymentUrl = createPaymentUrl(req, order._id.toString(), totalAmount, `Payment for rental order ${order._id}`);

    res.status(201).json({ success: true, data: order, paymentUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    VNPay Return URL Handler
// @route   GET /api/orders/vnpay_return
// @access  Public
exports.vnpayReturn = async (req, res) => {
  try {
    let vnp_Params = req.query;

    if (verifyReturnUrl(vnp_Params)) {
      const orderId = vnp_Params['vnp_TxnRef'];
      const responseCode = vnp_Params['vnp_ResponseCode'];

      const order = await Order.findById(orderId);

      if (order && responseCode === '00') {
        order.status = 'reserved';
        order.vnpayTxnRef = vnp_Params['vnp_TransactionNo'];
        await order.save();
        return res.redirect('http://localhost:5173/orders?payment=success');
      } else {
        return res.redirect('http://localhost:5173/orders?payment=fail');
      }
    } else {
      return res.redirect('http://localhost:5173/orders?payment=fail&reason=checksum');
    }
  } catch (error) {
    return res.redirect('http://localhost:5173/orders?payment=fail&error=' + encodeURIComponent(error.message));
  }
};

exports.confirmHandover = async (req, res) => {
  try {
    const { otp, handoverImages } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã bảo mật OTP từ Renter để xác nhận bàn giao đồ.' });
    }

    if (!handoverImages || !Array.isArray(handoverImages) || handoverImages.length < 3 || handoverImages.length > 5) {
      return res.status(400).json({ success: false, message: 'Vui lòng chụp và tải lên từ 3 đến 5 hình ảnh hiện trạng thiết bị khi bàn giao để lưu trữ làm bằng chứng.' });
    }

    const order = await Order.findById(req.params.id).populate('asset');
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

    if (order.status !== 'reserved') {
      return res.status(400).json({ success: false, message: 'Đơn hàng phải ở trạng thái đã đặt cọc (reserved) để thực hiện bàn giao.' });
    }

    // Only the Lender can execute the handover confirm
    if (req.user._id.toString() !== order.asset.lender.toString()) {
      return res.status(403).json({ success: false, message: 'Chỉ có Lender sở hữu tài sản mới được quyền nhập OTP xác nhận bàn giao đồ.' });
    }

    // Verify OTP
    if (order.handoverOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Mã xác thực bàn giao OTP không chính xác. Vui lòng kiểm tra lại.' });
    }

    order.status = 'active';
    order.handoverImages = handoverImages;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Bàn giao thiết bị thành công! Đơn hàng đã chuyển sang trạng thái hoạt động (active).',
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.confirmReturn = async (req, res) => {
  try {
    const { otp, returnImages } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã bảo mật OTP trả hàng từ Renter.' });
    }

    if (!returnImages || !Array.isArray(returnImages) || returnImages.length < 3 || returnImages.length > 5) {
      return res.status(400).json({ success: false, message: 'Vui lòng chụp và tải lên từ 3 đến 5 hình ảnh hiện trạng thiết bị khi trả hàng để lưu trữ làm bằng chứng.' });
    }

    const order = await Order.findById(req.params.id).populate('asset');
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

    if (order.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Đơn hàng phải ở trạng thái đang thuê (active) mới thực hiện trả hàng.' });
    }

    if (req.user._id.toString() !== order.asset.lender.toString()) {
      return res.status(403).json({ success: false, message: 'Chỉ có Lender sở hữu tài sản mới được quyền xác nhận nhận lại đồ.' });
    }

    // Verify OTP
    if (order.returnOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Mã xác thực trả hàng OTP không chính xác. Vui lòng kiểm tra lại.' });
    }

    order.status = 'completed';
    const platformFeePercent = 0.1; // 10%
    const platformFee = order.totalRent * platformFeePercent;
    const lenderPayout = order.totalRent - platformFee;

    order.platformFee = platformFee;
    order.returnImages = returnImages;
    await order.save();

    // Settle funds in wallet
    const lender = await User.findById(order.asset.lender);
    lender.balance += lenderPayout;
    await lender.save();

    const renter = await User.findById(order.renter);
    renter.balance += order.deposit; // Returning deposit
    await renter.save();

    res.status(200).json({
      success: true,
      message: 'Trả đồ và quyết toán thành công! Tiền cọc đã được hoàn lại cho Renter và tiền thuê (sau khi khấu trừ 10% phí vận hành) đã được chuyển vào số dư ví của Lender.',
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Settle Order (Admin)
// @route   PUT /api/orders/:id/settle
// @access  Private (Admin)
exports.settleOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('asset');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status !== 'returned') {
      return res.status(400).json({ success: false, message: 'Order must be returned before settlement' });
    }

    const platformFeePercent = 0.1; // 10%
    const platformFee = order.totalRent * platformFeePercent;
    const lenderPayout = order.totalRent - platformFee;

    order.platformFee = platformFee;
    order.status = 'completed';
    await order.save();

    // Settle funds in wallet
    const lender = await User.findById(order.asset.lender);
    lender.balance += lenderPayout;
    await lender.save();

    const renter = await User.findById(order.renter);
    renter.balance += order.deposit; // Returning deposit
    await renter.save();

    res.status(200).json({ success: true, message: 'Order settled successfully', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Raise Dispute
// @route   PUT /api/orders/:id/dispute
// @access  Private (Lender/Renter)
exports.raiseDispute = async (req, res) => {
  try {
    const { disputeNotes } = req.body;
    const order = await Order.findById(req.params.id).populate('asset');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (['completed', 'disputed', 'pending_payment'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot dispute in this status' });
    }

    order.status = 'disputed';
    order.disputeNotes = disputeNotes;
    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resolve Dispute
// @route   PUT /api/orders/:id/resolve-dispute
// @access  Private (Admin/Inspector)
exports.resolveDispute = async (req, res) => {
  try {
    const { lenderCompensation, renterRefund } = req.body;
    const order = await Order.findById(req.params.id).populate('asset');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status !== 'disputed') {
      return res.status(400).json({ success: false, message: 'Order is not disputed' });
    }

    order.status = 'completed';
    order.inspector = req.user._id;
    await order.save();

    const lender = await User.findById(order.asset.lender);
    lender.balance += lenderCompensation;
    await lender.save();

    const renter = await User.findById(order.renter);
    renter.balance += renterRefund;
    await renter.save();

    res.status(200).json({ success: true, message: 'Dispute resolved', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel Order (Renter/Lender)
// @route   PUT /api/orders/:id/cancel
// @access  Private (Renter/Lender)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('asset');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }

    // Only reserved or pending_payment orders can be cancelled
    if (!['pending_payment', 'reserved'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Không thể hủy đơn hàng ở trạng thái hiện tại.' });
    }

    const isRenter = req.user._id.toString() === order.renter.toString();
    const isLender = req.user._id.toString() === order.asset.lender.toString();

    if (!isRenter && !isLender) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền hủy đơn hàng này.' });
    }

    // Case 1: Order is pending payment (no funds collected yet)
    if (order.status === 'pending_payment') {
      order.status = 'completed'; // Move to terminal state
      order.disputeNotes = 'Hủy đơn hàng chưa thanh toán.';
      await order.save();
      return res.status(200).json({
        success: true,
        message: 'Hủy đơn hàng chưa thanh toán thành công.',
        data: order
      });
    }

    // Case 2: Order is reserved (funds already paid via VNPay)
    const hoursToStart = (new Date(order.startDate).getTime() - Date.now()) / (1000 * 60 * 60);

    if (isRenter) {
      // Renter cancels
      let refundRent = 0;
      let refundDeposit = order.deposit;
      let penalty = 0;
      let message = '';

      if (hoursToStart >= 24) {
        // >= 24 hours: 100% refund
        refundRent = order.totalRent;
        message = 'Hủy đơn hàng trước 24 giờ thành công. Renter được hoàn trả 100% tiền thuê và tiền cọc.';
      } else if (hoursToStart < 6) {
        // < 6 hours: 30% rent penalty to Lender
        penalty = Math.round(order.totalRent * 0.3);
        refundRent = order.totalRent - penalty;
        message = `Hủy đơn hàng sát giờ thuê (< 6 giờ). Renter bị phạt 30% tiền thuê (${penalty.toLocaleString('vi-VN')} đ) đền bù cho Lender. Phần còn lại đã được hoàn trả.`;
      } else {
        // Between 6 and 24 hours: No penalty (100% refund) based on guidelines
        refundRent = order.totalRent;
        message = 'Hủy đơn hàng thành công. Renter được hoàn trả 100% tiền thuê và tiền cọc.';
      }

      // Process wallet updates
      const renter = await User.findById(order.renter);
      renter.balance += (refundRent + refundDeposit);
      await renter.save();

      if (penalty > 0) {
        const lender = await User.findById(order.asset.lender);
        lender.balance += penalty;
        await lender.save();
      }

      order.status = 'completed';
      order.disputeNotes = `Renter hủy đơn. Phạt: ${penalty} đ. Hoàn trả: ${refundRent + refundDeposit} đ.`;
      await order.save();

      return res.status(200).json({
        success: true,
        message,
        data: order
      });
    } else {
      // Lender cancels: Refund 100% to renter, deduct 10% rent from Lender, transfer to Renter, penalize reputation score
      const penalty = Math.round(order.totalRent * 0.1);

      const renter = await User.findById(order.renter);
      renter.balance += (order.totalRent + order.deposit + penalty);
      await renter.save();

      const lender = await User.findById(order.asset.lender);
      lender.balance -= penalty;
      // Deduct reputation score by 0.5 points
      lender.reputationScore = Math.max(1.0, Math.round((lender.reputationScore - 0.5) * 10) / 10);
      await lender.save();

      order.status = 'completed';
      order.disputeNotes = `Lender hủy đơn đột xuất. Phạt Lender: ${penalty} đ. Bồi thường cho Renter: ${penalty} đ. Hoàn trả: ${order.totalRent + order.deposit} đ. Khấu trừ 0.5 điểm uy tín.`;
      await order.save();

      return res.status(200).json({
        success: true,
        message: `Lender hủy đơn đột xuất thành công. Đã hoàn trả 100% tiền thuê + cọc cho Renter và bồi thường 10% tiền thuê (${penalty.toLocaleString('vi-VN')} đ) trích từ số dư ví Lender. Khấu trừ 0.5 điểm uy tín của Lender.`,
        data: order
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request Lease Extension (Renter)
// @route   POST /api/orders/:id/extend
// @access  Private (Renter)
exports.requestExtension = async (req, res) => {
  try {
    const { extensionDays } = req.body;

    if (!extensionDays || typeof extensionDays !== 'number' || extensionDays <= 0) {
      return res.status(400).json({ success: false, message: 'Số ngày gia hạn không hợp lệ. Phải lớn hơn 0.' });
    }

    const order = await Order.findById(req.params.id).populate('asset');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }

    if (order.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể gia hạn khi đơn hàng đang ở trạng thái hoạt động (active).' });
    }

    if (req.user._id.toString() !== order.renter.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện gia hạn đơn hàng này.' });
    }

    if (order.extensionStatus === 'pending') {
      return res.status(400).json({ success: false, message: 'Đang có một yêu cầu gia hạn chưa được xử lý.' });
    }

    // Check availability for extended dates
    const extendedStartDate = new Date(order.endDate);
    const extendedEndDate = new Date(order.endDate);
    extendedEndDate.setDate(extendedEndDate.getDate() + extensionDays);

    const overlappingOrders = await Order.find({
      _id: { $ne: order._id },
      asset: order.asset._id,
      status: { $in: ['reserved', 'active'] },
      $or: [
        { startDate: { $lte: extendedEndDate }, endDate: { $gte: extendedStartDate } }
      ]
    });

    if (overlappingOrders.length > 0) {
      return res.status(400).json({ success: false, message: 'Không thể gia hạn thiết bị này vì đã có khách hàng khác đặt lịch tiếp theo.' });
    }

    const extensionRent = extensionDays * order.asset.pricePerDay;

    order.extensionDays = extensionDays;
    order.extensionRent = extensionRent;
    order.extensionStatus = 'pending';
    await order.save();

    res.status(200).json({
      success: true,
      message: `Gửi yêu cầu gia hạn ${extensionDays} ngày thành công. Đang chờ Lender phê duyệt. Chi phí bổ sung dự kiến: ${extensionRent.toLocaleString('vi-VN')} đ.`,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve/Reject Lease Extension (Lender)
// @route   PUT /api/orders/:id/extend/approve
// @access  Private (Lender)
exports.approveExtension = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái quyết định gia hạn phải là "approved" hoặc "rejected".' });
    }

    const order = await Order.findById(req.params.id).populate('asset');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }

    if (order.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Đơn hàng không ở trạng thái hoạt động.' });
    }

    if (req.user._id.toString() !== order.asset.lender.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không sở hữu thiết bị này nên không có quyền duyệt gia hạn.' });
    }

    if (order.extensionStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Không có yêu cầu gia hạn nào đang chờ duyệt.' });
    }

    if (status === 'rejected') {
      order.extensionStatus = 'rejected';
      await order.save();
      return res.status(200).json({
        success: true,
        message: 'Đã từ chối yêu cầu gia hạn của Renter.',
        data: order
      });
    }

    // Approve extension: Check renter wallet balance
    const renter = await User.findById(order.renter);
    if (renter.balance < order.extensionRent) {
      return res.status(400).json({
        success: false,
        message: `Số dư ví của Renter (${renter.balance.toLocaleString('vi-VN')} đ) không đủ để thanh toán bổ sung phí gia hạn (${order.extensionRent.toLocaleString('vi-VN')} đ). Gia hạn thất bại.`
      });
    }

    // Perform wallet transfers (90% to Lender, 10% platform fee)
    renter.balance -= order.extensionRent;
    await renter.save();

    const platformFee = Math.round(order.extensionRent * 0.1);
    const lenderPayout = order.extensionRent - platformFee;

    const lender = await User.findById(order.asset.lender);
    lender.balance += lenderPayout;
    await lender.save();

    // Update order schedule
    const newEndDate = new Date(order.endDate);
    newEndDate.setDate(newEndDate.getDate() + order.extensionDays);

    order.endDate = newEndDate;
    order.rentalDays += order.extensionDays;
    order.totalRent += order.extensionRent;
    order.platformFee += platformFee;
    order.extensionStatus = 'approved';
    await order.save();

    res.status(200).json({
      success: true,
      message: `Duyệt gia hạn thành công! Renter được gia hạn thêm ${order.extensionDays} ngày. Phí thuê bổ sung đã thanh toán từ ví Renter.`,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit Cross-Rating & Review (Renter/Lender)
// @route   POST /api/orders/:id/rate
// @access  Private (Renter/Lender)
exports.submitRating = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Điểm đánh giá phải là số từ 1 đến 5 sao.' });
    }

    const order = await Order.findById(req.params.id).populate('asset');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể đánh giá sau khi đơn hàng đã hoàn tất (completed).' });
    }

    const isRenter = req.user._id.toString() === order.renter.toString();
    const isLender = req.user._id.toString() === order.asset.lender.toString();

    if (!isRenter && !isLender) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền đánh giá đơn hàng này.' });
    }

    if (isRenter) {
      // Renter is rating Lender
      if (order.lenderRating) {
        return res.status(400).json({ success: false, message: 'Bạn đã đánh giá Lender cho đơn hàng này rồi.' });
      }

      order.lenderRating = rating;
      order.lenderComment = comment || '';
      await order.save();

      // Update Lender reputation Score
      const lender = await User.findById(order.asset.lender);
      lender.ratingsReceived.push(rating);
      const sum = lender.ratingsReceived.reduce((a, b) => a + b, 0);
      lender.reputationScore = Math.round((sum / lender.ratingsReceived.length) * 10) / 10;
      await lender.save();

      return res.status(200).json({
        success: true,
        message: `Đánh giá Lender thành công! Điểm uy tín mới của Lender: ${lender.reputationScore}/5.0`,
        data: order
      });
    } else {
      // Lender is rating Renter
      if (order.renterRating) {
        return res.status(400).json({ success: false, message: 'Bạn đã đánh giá Renter cho đơn hàng này rồi.' });
      }

      order.renterRating = rating;
      order.renterComment = comment || '';
      await order.save();

      // Update Renter reputation Score
      const renter = await User.findById(order.renter);
      renter.ratingsReceived.push(rating);
      const sum = renter.ratingsReceived.reduce((a, b) => a + b, 0);
      renter.reputationScore = Math.round((sum / renter.ratingsReceived.length) * 10) / 10;
      await renter.save();

      return res.status(200).json({
        success: true,
        message: `Đánh giá Renter thành công! Điểm uy tín mới của Renter: ${renter.reputationScore}/5.0. Nếu điểm >= 4.8, Renter sẽ nhận được giảm 20% đặt cọc ở đơn sau.`,
        data: order
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Auto-Generated Rental E-Contract (Renter/Lender)
// @route   GET /api/orders/:id/contract
// @access  Private (Renter/Lender)
exports.getContract = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('asset')
      .populate('renter')
      .populate({
        path: 'asset',
        populate: { path: 'lender' }
      });

    if (!order) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(404).send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px; padding: 20px;">
          <h2 style="color: #e53e3e;">Không tìm thấy đơn hàng</h2>
          <p>Không tìm thấy thông tin đơn hàng trong hệ thống.</p>
        </div>
      `);
    }

    const isRenter = req.user._id.toString() === order.renter._id.toString();
    const isLender = req.user._id.toString() === order.asset.lender._id.toString();

    if (!isRenter && !isLender) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(403).send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px; padding: 20px;">
          <h2 style="color: #e53e3e;">Lỗi xác thực</h2>
          <p>Bạn không có quyền truy cập hợp đồng của đơn hàng này.</p>
        </div>
      `);
    }

    if (order.status === 'pending_payment') {
      res.setHeader('Content-Type', 'text/html');
      return res.status(400).send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px; padding: 20px;">
          <h2 style="color: #dd6b20;">Đơn hàng chưa thanh toán</h2>
          <p>Đơn hàng chưa thanh toán tiền cọc và thuê nên chưa thể khởi tạo Hợp đồng điện tử.</p>
        </div>
      `);
    }

    const isHighValue = order.asset && order.asset.depositAmount >= 2000000;
    if (!isHighValue) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(400).send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px; padding: 20px;">
          <h2 style="color: #4a5568;">Không yêu cầu hợp đồng</h2>
          <p>Đơn hàng này không thuộc diện thiết bị giá trị cao (tiền cọc từ 2.000.000 đ trở lên) nên không yêu cầu Hợp đồng điện tử.</p>
        </div>
      `);
    }

    const contractId = `VELOX-CONTRACT-${order._id.toString().toUpperCase()}`;
    const dateCreated = new Date(order.createdAt).toLocaleDateString('vi-VN');
    const rentStart = new Date(order.startDate).toLocaleDateString('vi-VN');
    const rentEnd = new Date(order.endDate).toLocaleDateString('vi-VN');

    const renterName = order.renter.name;
    const renterPhone = order.renter.phoneNumber || 'Đang cập nhật';
    const renterCCCD = order.renter.lenderOnboarding?.cccdFront ? 'ĐÃ XÁC THỰC EKYC CCCD' : 'ĐÃ LIÊN KẾT TÀI KHOẢN';
    const renterAddress = order.renter.address?.street
      ? `${order.renter.address.street}, ${order.renter.address.ward}, ${order.renter.address.district}, ${order.renter.address.province}`
      : 'Hệ thống định vị thực tế';

    const lenderName = order.asset.lender.name;
    const lenderPhone = order.asset.lender.phoneNumber || 'Đang cập nhật';
    const lenderCCCD = order.asset.lender.lenderOnboarding?.cccdFront ? 'ĐÃ XÁC THỰC EKYC CCCD' : 'ĐÃ LIÊN KẾT TÀI KHOẢN';
    const lenderAddress = order.asset.lender.address?.street
      ? `${order.asset.lender.address.street}, ${order.asset.lender.address.ward}, ${order.asset.lender.address.district}, ${order.asset.lender.address.province}`
      : 'Hệ thống định vị thực tế';

    const assetName = order.asset.name;
    const pricePerDay = order.asset.pricePerDay;
    const rentalDays = order.rentalDays;
    const totalRent = order.totalRent;
    const deposit = order.deposit;
    const vnpayTxnRef = order.vnpayTxnRef || 'SYSTEM_SIGN';

    const contractHtml = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); color: #333333; line-height: 1.6;">
        <div style="text-align: center; border-bottom: 2px solid #2B6CB0; padding-bottom: 20px; margin-bottom: 30px;">
          <h2 style="margin: 0; color: #2B6CB0; text-transform: uppercase; font-size: 24px; letter-spacing: 1px;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h2>
          <h4 style="margin: 5px 0 0 0; font-weight: normal; font-size: 14px; letter-spacing: 0.5px;">Độc lập - Tự do - Hạnh phúc</h4>
          <div style="width: 150px; height: 1px; background-color: #a0aec0; margin: 15px auto 0 auto;"></div>
          <h1 style="margin: 25px 0 5px 0; color: #1a202c; font-size: 22px; text-transform: uppercase;">HỢP ĐỒNG THUÊ THIẾT BỊ ĐIỆN TỬ & CẮM TRẠI P2P</h1>
          <p style="margin: 0; color: #718096; font-size: 12px;">Mã số hợp đồng: <strong>${contractId}</strong></p>
        </div>

        <p style="font-style: italic; color: #4a5568; font-size: 14px; margin-bottom: 25px;">
          - Căn cứ Bộ luật Dân sự nước Cộng hòa Xã hội Chủ nghĩa Việt Nam số 91/2015/QH13 có hiệu lực từ ngày 01/01/2017;<br>
          - Căn cứ nhu cầu và khả năng tự thỏa thuận của các bên trên nền tảng P2P VeloX.
        </p>

        <p style="font-size: 14px; margin-bottom: 25px;">Hôm nay, ngày ${dateCreated}, hai Bên gồm có:</p>

        <!-- BÊN CHO THUÊ (LENDER) -->
        <div style="background-color: #f7fafc; padding: 15px; border-left: 4px solid #4a5568; margin-bottom: 20px; border-radius: 0 4px 4px 0;">
          <h3 style="margin-top: 0; color: #2d3748; font-size: 16px; text-transform: uppercase; border-bottom: 1px dashed #cbd5e0; padding-bottom: 5px;">BÊN A: BÊN CHO THUÊ (LENDER)</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="width: 30%; font-weight: bold; padding: 4px 0;">Họ tên:</td>
              <td style="padding: 4px 0;">${lenderName}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 4px 0;">Số điện thoại:</td>
              <td style="padding: 4px 0;">${lenderPhone}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 4px 0;">Trạng thái eKYC:</td>
              <td style="padding: 4px 0; color: #38a169; font-weight: bold;">${lenderCCCD}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 4px 0;">Địa chỉ:</td>
              <td style="padding: 4px 0;">${lenderAddress}</td>
            </tr>
          </table>
        </div>

        <!-- BÊN THUÊ (RENTER) -->
        <div style="background-color: #f7fafc; padding: 15px; border-left: 4px solid #2B6CB0; margin-bottom: 30px; border-radius: 0 4px 4px 0;">
          <h3 style="margin-top: 0; color: #2d3748; font-size: 16px; text-transform: uppercase; border-bottom: 1px dashed #cbd5e0; padding-bottom: 5px;">BÊN B: BÊN THUÊ (RENTER)</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="width: 30%; font-weight: bold; padding: 4px 0;">Họ tên:</td>
              <td style="padding: 4px 0;">${renterName}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 4px 0;">Số điện thoại:</td>
              <td style="padding: 4px 0;">${renterPhone}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 4px 0;">Trạng thái eKYC:</td>
              <td style="padding: 4px 0; color: #38a169; font-weight: bold;">${renterCCCD}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 4px 0;">Địa chỉ:</td>
              <td style="padding: 4px 0;">${renterAddress}</td>
            </tr>
          </table>
        </div>

        <h3 style="color: #2d3748; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 25px;">ĐIỀU 1: ĐỐI TƯỢNG VÀ THỜI GIAN THUÊ THIẾT BỊ</h3>
        <p style="font-size: 14px; margin: 10px 0;">
          1.1. Bên A đồng ý cho Bên B thuê, và Bên B đồng ý thuê thiết bị: <strong>${assetName}</strong>.<br>
          1.2. Thời gian thuê bắt đầu từ ngày <strong>${rentStart}</strong> đến hết ngày <strong>${rentEnd}</strong> (Tổng cộng <strong>${rentalDays} ngày</strong>).
        </p>

        <h3 style="color: #2d3748; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 25px;">ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN</h3>
        <p style="font-size: 14px; margin: 10px 0;">
          2.1. Đơn giá thuê thiết bị: <strong>${pricePerDay.toLocaleString('vi-VN')} đ/ngày</strong>.<br>
          2.2. Tổng tiền thuê: <strong>${totalRent.toLocaleString('vi-VN')} đ</strong>.<br>
          2.3. Số tiền đặt cọc tài sản (ký quỹ đảm bảo): <strong>${deposit.toLocaleString('vi-VN')} đ</strong>.<br>
          2.4. Phương thức thanh toán: <strong>Thanh toán trực tuyến qua Ví điện tử / Cổng VNPay Sandbox và đóng băng tài sản cọc trên hệ thống VeloX</strong>. Tiền cọc sẽ tự động hoàn trả Bên B sau khi hoàn tất nghĩa vụ trả hàng mà không có tranh chấp phát sinh.
        </p>

        <h3 style="color: #2d3748; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 25px;">ĐIỀU 3: MINH CHỨNG HÌNH ẢNH VÀ QUY TRÌNH GIAO NHẬN THỰC TẾ</h3>
        <p style="font-size: 14px; margin: 10px 0;">
          3.1. Hai bên đồng ý tuân thủ quy trình kiểm tra và lưu lại hình ảnh đối chứng để giải quyết tranh chấp pháp lý:<br>
          - <strong>Lúc bàn giao thiết bị</strong>: Bên A nhập mã OTP bàn giao và bắt buộc tải lên từ 3 - 5 ảnh hiện trạng.<br>
          - <strong>Lúc nhận lại thiết bị</strong>: Bên A nhập mã OTP trả đồ và bắt buộc tải lên từ 3 - 5 ảnh hiện trạng lúc thu hồi.<br>
          3.2. Ảnh đối chứng là bằng chứng pháp lý cao nhất để hệ thống phân định thiệt hại khi xảy ra trầy xước, mất tem niêm phong hoặc hư hỏng linh kiện.
        </p>

        <h3 style="color: #2d3748; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 25px;">ĐIỀU 4: ĐIỀU KHOẢN CAM KẾT VÀ CHỮ KÝ SỐ XÁC NHẬN</h3>
        <p style="font-size: 14px; margin: 10px 0;">
          4.1. Bên B cam kết bảo quản tài sản thuê cẩn thận, sử dụng đúng mục đích kỹ thuật của thiết bị.<br>
          4.2. Trách nhiệm Bên A bàn giao đúng thời hạn, tình trạng thiết bị hoạt động bình thường như cam kết.<br>
          4.3. Hợp đồng điện tử này có giá trị pháp lý tương đương văn bản giấy từ thời điểm Renter thanh toán ký quỹ đặt cọc thành công.
        </p>

        <div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center;">
          <div style="width: 45%;">
            <p style="font-size: 14px; margin-bottom: 60px;"><strong>Đại diện Bên A (Lender)</strong></p>
            <p style="color: #2b6cb0; border: 2px dashed #2b6cb0; padding: 10px; display: inline-block; border-radius: 4px; font-family: monospace; font-size: 12px; background-color: #ebf8ff;">
               KÝ SỐ VELOX - LENDER<br>
              <strong>${lenderName}</strong><br>
              Mã GD: ${vnpayTxnRef}
            </p>
          </div>
          <div style="width: 45%;">
            <p style="font-size: 14px; margin-bottom: 60px;"><strong>Đại diện Bên B (Renter)</strong></p>
            <p style="color: #2b6cb0; border: 2px dashed #2b6cb0; padding: 10px; display: inline-block; border-radius: 4px; font-family: monospace; font-size: 12px; background-color: #ebf8ff;">
               KÝ SỐ VELOX - RENTER<br>
              <strong>${renterName}</strong><br>
              Mã GD: ${vnpayTxnRef}
            </p>
          </div>
        </div>

        <div style="margin-top: 40px; border-top: 1px solid #cbd5e0; padding-top: 15px; text-align: center; color: #a0aec0; font-size: 11px;">
          Hợp đồng được lập và lưu giữ điện tử trên hệ thống P2P VeloX Platform.<br>
          Bản quyền thuộc về Công ty Công nghệ P2P VeloX Việt Nam.
        </div>
      </div>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(contractHtml);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current renter's rental history
// @route   GET /api/orders/my-rentals
// @access  Private (Renter)
exports.getMyRentals = async (req, res) => {
  try {
    const orders = await Order.find({ renter: req.user._id })
      .populate({
        path: 'asset',
        populate: { path: 'lender', select: 'name role' }
      })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current lender's incoming gear rental orders
// @route   GET /api/orders/incoming
// @access  Private (Lender)
exports.getIncomingOrders = async (req, res) => {
  try {
    const assets = await Asset.find({ lender: req.user._id });
    const assetIds = assets.map(a => a._id);
    
    const orders = await Order.find({ asset: { $in: assetIds } })
      .populate('asset')
      .populate('renter', 'name email phoneNumber')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
