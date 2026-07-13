const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
    if (req.user.isBanned) {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

const checkProfileCompleted = (req, res, next) => {
  if (!req.user.isProfileCompleted) {
    return res.status(403).json({
      success: false,
      code: 'PROFILE_INCOMPLETE',
      message: 'Vui lòng hoàn thiện thông tin cá nhân (Số điện thoại và Địa chỉ mặc định) trước khi thực hiện hành động này.'
    });
  }
  next();
};

const checkLenderPermission = (req, res, next) => {
  if (req.user.role !== 'lender' || req.user.lenderStatus !== 'approved') {
    let errorMsg = 'Bạn chưa được kích hoạt quyền Người cho thuê (Lender). Vui lòng đăng ký eKYC.';
    if (req.user.lenderStatus === 'pending') {
      errorMsg = 'Hồ sơ đăng ký Người cho thuê (Lender) của bạn đang được Admin duyệt. Vui lòng quay lại sau khi hồ sơ được phê duyệt.';
    } else if (req.user.lenderStatus === 'rejected') {
      errorMsg = `Yêu cầu làm Người cho thuê (Lender) của bạn đã bị từ chối. Lý do: "${req.user.lenderOnboarding.rejectReason}". Vui lòng nộp lại hồ sơ hợp lệ.`;
    }

    return res.status(403).json({
      success: false,
      code: 'LENDER_NOT_APPROVED',
      lenderStatus: req.user.lenderStatus,
      message: errorMsg
    });
  }
  next();
};

const checkRenterVerified = (req, res, next) => {
  if (req.user.renterStatus !== 'approved') {
    let errorMsg = 'Vui lòng xác thực hình ảnh CCCD (eKYC Renter) trước khi thực hiện đặt thuê thiết bị.';
    if (req.user.renterStatus === 'pending') {
      errorMsg = 'Hồ sơ eKYC xác thực Renter của bạn đang được Admin kiểm duyệt. Kết quả sẽ có trong vòng 24h.';
    } else if (req.user.renterStatus === 'rejected') {
      errorMsg = `Hồ sơ eKYC xác thực Renter của bạn bị từ chối. Lý do: "${req.user.renterOnboarding?.rejectReason}". Vui lòng cập nhật và nộp lại hồ sơ.`;
    }

    return res.status(403).json({
      success: false,
      code: 'RENTER_NOT_VERIFIED',
      renterStatus: req.user.renterStatus,
      message: errorMsg
    });
  }
  next();
};

module.exports = { protect, authorize, checkProfileCompleted, checkLenderPermission, checkRenterVerified };
