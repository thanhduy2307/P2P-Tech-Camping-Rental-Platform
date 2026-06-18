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
          lenderApplications: pendingLenderAppsCount
        }
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
