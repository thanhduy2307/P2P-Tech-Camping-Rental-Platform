const User = require('../models/User');
const Asset = require('../models/Asset');
const Order = require('../models/Order');
const WithdrawalRequest = require('../models/WithdrawalRequest');

// @desc    Lấy thống kê số liệu tổng quan hệ thống
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const renters = await User.countDocuments({ role: 'renter' });
    const lenders = await User.countDocuments({ role: 'lender' });
    const inspectors = await User.countDocuments({ role: 'inspector' });
    const admins = await User.countDocuments({ role: 'admin' });

    const totalAssets = await Asset.countDocuments();
    const verifiedAssets = await Asset.countDocuments({ status: 'verified' });
    const pendingAssets = await Asset.countDocuments({ status: 'pending_approval' });
    const rejectedAssets = await Asset.countDocuments({ status: 'rejected' });

    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    const disputedOrders = await Order.countDocuments({ status: 'disputed' });
    const activeOrders = await Order.countDocuments({ status: 'active' });
    const reservedOrders = await Order.countDocuments({ status: 'reserved' });

    // Financial calculations
    const users = await User.find();
    const totalWalletBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);

    const settledOrders = await Order.find({ status: 'completed' });
    const totalPlatformFee = settledOrders.reduce((sum, o) => sum + (o.platformFee || 0), 0);
    const totalTransactionVolume = settledOrders.reduce((sum, o) => sum + (o.totalRent || 0), 0);

    const pendingWithdrawalsCount = await WithdrawalRequest.countDocuments({ status: 'pending' });
    const pendingLenderAppsCount = await User.countDocuments({ lenderStatus: 'pending' });
    const pendingRenterAppsCount = await User.countDocuments({ renterStatus: 'pending' });

    // Top users by total withdrawal amount (approved requests only)
    const topWithdrawalUsers = await WithdrawalRequest.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$lender',
          totalWithdrawn: { $sum: '$amount' },
          withdrawalCount: { $sum: 1 },
          lastWithdrawnAt: { $max: '$transferredAt' }
        }
      },
      { $sort: { totalWithdrawn: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: 1,
          totalWithdrawn: 1,
          withdrawalCount: 1,
          lastWithdrawnAt: 1,
          name: '$userInfo.name',
          email: '$userInfo.email',
          avatar: '$userInfo.avatar',
          role: '$userInfo.role'
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: { total: totalUsers, renters, lenders, inspectors, admins },
        assets: { total: totalAssets, verified: verifiedAssets, pending: pendingAssets, rejected: rejectedAssets },
        orders: { total: totalOrders, completed: completedOrders, disputed: disputedOrders, active: activeOrders, reserved: reservedOrders },
        financials: {
          totalWalletBalance,
          totalPlatformFee,
          totalTransactionVolume,
        },
        pendingCounts: {
          withdrawals: pendingWithdrawalsCount,
          lenderApplications: pendingLenderAppsCount,
          renterApplications: pendingRenterAppsCount
        },
        topWithdrawalUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Lấy danh sách người dùng trong hệ thống
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cập nhật vai trò (Role) của người dùng
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['renter', 'lender', 'inspector', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }
    user.role = role;
    await user.save();
    res.status(200).json({ success: true, message: 'Cập nhật vai trò thành công.', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Khóa / Mở khóa tài khoản người dùng
// @route   PUT /api/admin/users/:id/ban
// @access  Private (Admin)
exports.toggleUserBan = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Không thể khóa tài khoản Admin.' });
    }
    user.isBanned = !user.isBanned;
    await user.save();
    res.status(200).json({
      success: true,
      message: user.isBanned ? 'Đã khóa tài khoản người dùng.' : 'Đã mở khóa tài khoản người dùng.',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Lấy danh sách tất cả tài sản trong hệ thống
// @route   GET /api/admin/assets
// @access  Private (Admin)
exports.getAssets = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;
    const assets = await Asset.find(query).populate('lender', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: assets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Lấy danh sách tất cả đơn hàng trong hệ thống
// @route   GET /api/admin/orders
// @access  Private (Admin)
exports.getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;
    const orders = await Order.find(query)
      .populate('asset', 'name pricePerDay lender')
      .populate('renter', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Lấy danh sách STK của Admin để dùng cho dropdown khi duyệt rút tiền
// @route   GET /api/admin/bank-accounts
// @access  Private (Admin)
exports.getAdminBankAccounts = async (req, res) => {
  try {
    const bankAccounts = [
      {
        id: 1,
        bankName: 'Vietcombank',
        accountNumber: '0123456789',
        accountHolder: 'NGUYEN VAN ADMIN',
        shortName: 'VCB - 0123456789'
      },
      {
        id: 2,
        bankName: 'Techcombank',
        accountNumber: '190366668888',
        accountHolder: 'NGUYEN VAN ADMIN',
        shortName: 'TCB - 190366668888'
      },
      {
        id: 3,
        bankName: 'MBBank',
        accountNumber: '888899990000',
        accountHolder: 'NGUYEN VAN ADMIN',
        shortName: 'MB - 888899990000'
      }
    ];

    res.status(200).json({ success: true, data: bankAccounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resolve dispute (simple admin version)
// @route   POST /api/admin/disputes/:id/resolve
// @access  Private (Admin)
exports.resolveDispute = async (req, res) => {
  try {
    const { resolution, note } = req.body; // 'lender' or 'renter'
    const order = await Order.findById(req.params.id).populate('asset');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'disputed') {
      return res.status(400).json({ success: false, message: 'Order is not disputed' });
    }

    const platformFeePercent = 0.1;
    const lender = await User.findById(order.asset.lender);
    const renter = await User.findById(order.renter);
    let message = 'Đã giải quyết tranh chấp.';

    if (resolution === 'renter') {
      // Favor the renter
      if (order.disputeCreator === 'renter') {
        // accept_renter_dispute: renter rejected at handover, full refund
        order.platformFee = 0;
        let refund = order.totalRent;
        if (order.depositMethod === 'online') refund += order.deposit;
        renter.balance += refund;
        message = 'Chấp nhận khiếu nại Renter. Hoàn 100% tiền.';
      } else {
        // reject_lender_dispute: lender's damage claim rejected
        const fee = order.totalRent * platformFeePercent;
        order.platformFee = fee;
        const payout = order.totalRent - fee;
        lender.balance += payout;
        if (order.depositMethod === 'online') {
          renter.balance += order.deposit;
        } else {
          order.actualCashDepositReturned = order.deposit;
        }
        message = 'Bác bỏ yêu cầu bồi thường của Lender. Hoàn cọc 100% cho Renter.';
      }
    } else {
      // Favor the lender
      if (order.disputeCreator === 'renter') {
        // reject_renter_dispute: renter's rejection was unjustified
        const fee = order.totalRent * platformFeePercent;
        order.platformFee = fee;
        const payout = order.totalRent - fee;
        if (order.depositMethod === 'online') {
          lender.balance += payout;
          renter.balance += order.deposit;
        } else {
          lender.balance += payout;
          order.actualCashDepositReturned = order.deposit;
        }
        message = 'Bác bỏ khiếu nại Renter. Renter mất tiền thuê.';
      } else {
        // force_compensation: lender's damage claim accepted
        const fee = order.totalRent * platformFeePercent;
        order.platformFee = fee;
        const payout = order.totalRent - fee;
        if (order.depositMethod === 'online') {
          lender.balance += (payout + order.deposit);
          renter.balance -= order.deposit;
          if (renter.balance < 0) renter.balance = 0;
        } else {
          lender.balance += payout;
          order.actualCashDepositReturned = 0;
        }
        message = 'Chấp nhận yêu cầu bồi thường của Lender. Trừ cọc Renter.';
      }
    }

    order.status = 'completed';
    order.disputeStatus = 'resolved';
    order.adminNote = note || '';
    order.inspector = req.user._id;
    await order.save();
    await lender.save();
    await renter.save();

    res.status(200).json({ success: true, message, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
