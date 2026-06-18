const User = require('../models/User');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'renter'
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isProfileCompleted: user.isProfileCompleted,
        lenderStatus: user.lenderStatus,
        lenderOnboarding: user.lenderOnboarding,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isProfileCompleted: user.isProfileCompleted,
        lenderStatus: user.lenderStatus,
        lenderOnboarding: user.lenderOnboarding,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Google auth code missing' });
    }

    let tokens;
    try {
      const exchangeResult = await client.getToken({
        code,
        redirect_uri: 'postmessage'
      });
      tokens = exchangeResult.tokens;
    } catch (err) {
      const exchangeResult = await client.getToken(code);
      tokens = exchangeResult.tokens;
    }
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, sub } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId: sub,
        authProvider: 'google',
        role: 'renter' // Default role
      });
    } else if (!user.googleId) {
      // Link account
      user.googleId = sub;
      if (user.authProvider === 'local') {
        user.authProvider = 'google';
      }
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Google Login Successful! Please copy your token to use in Swagger.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isProfileCompleted: user.isProfileCompleted,
        lenderStatus: user.lenderStatus,
        lenderOnboarding: user.lenderOnboarding,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Google Auth Error: ' + error.message });
  }
};

exports.switchRole = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'renter') {
      // Check lenderStatus before allowing to switch to lender
      if (user.lenderStatus !== 'approved') {
        let errorMsg = 'Bạn chưa đăng ký làm Người cho thuê (Lender). Vui lòng gửi hồ sơ eKYC trước.';
        if (user.lenderStatus === 'pending') {
          errorMsg = 'Hồ sơ đăng ký Người cho thuê (Lender) của bạn đang được Admin kiểm duyệt. Kết quả sẽ có trong vòng 24h.';
        } else if (user.lenderStatus === 'rejected') {
          errorMsg = `Yêu cầu làm Người cho thuê (Lender) của bạn đã bị từ chối. Lý do: "${user.lenderOnboarding.rejectReason}". Vui lòng cập nhật và nộp lại hồ sơ.`;
        }

        return res.status(403).json({
          success: false,
          lenderStatus: user.lenderStatus,
          message: errorMsg
        });
      }
      user.role = 'lender';
    } else if (user.role === 'lender') {
      user.role = 'renter';
    } else {
      return res.status(400).json({ success: false, message: 'Role switching only available between renter and lender' });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `Role successfully switched to ${user.role}`,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isProfileCompleted: user.isProfileCompleted,
        lenderStatus: user.lenderStatus,
        lenderOnboarding: user.lenderOnboarding,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.completeProfile = async (req, res) => {
  try {
    const { phoneNumber, address, bankAccount } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Please provide phone number' });
    }

    if (!address || !address.province || !address.district || !address.ward || !address.street) {
      return res.status(400).json({ success: false, message: 'Please provide complete address (province, district, ward, street)' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.phoneNumber = phoneNumber;
    user.address = {
      province: address.province,
      district: address.district,
      ward: address.ward,
      street: address.street,
      coordinates: {
        lat: address.coordinates && address.coordinates.lat ? address.coordinates.lat : 0,
        lng: address.coordinates && address.coordinates.lng ? address.coordinates.lng : 0
      }
    };

    if (bankAccount) {
      user.bankAccount = {
        accountNumber: bankAccount.accountNumber || '',
        bankName: bankAccount.bankName || '',
        accountHolder: bankAccount.accountHolder || ''
      };
    }

    user.isProfileCompleted = true;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile completed successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phoneNumber: user.phoneNumber,
        address: user.address,
        bankAccount: user.bankAccount,
        isProfileCompleted: user.isProfileCompleted,
        lenderStatus: user.lenderStatus,
        lenderOnboarding: user.lenderOnboarding,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.applyLender = async (req, res) => {
  try {
    const { cccdFront, cccdBack, cccdSelfie, bankAccount } = req.body;

    if (!cccdFront || !cccdBack || !cccdSelfie) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ ảnh CCCD (Mặt trước, mặt sau và ảnh Selfie)' });
    }

    if (!bankAccount || !bankAccount.accountNumber || !bankAccount.bankName || !bankAccount.accountHolder) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin tài khoản ngân hàng nhận tiền' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.isProfileCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng bổ sung Số điện thoại và Địa chỉ mặc định trước khi đăng ký làm Người cho thuê (Lender).'
      });
    }

    if (user.lenderStatus === 'pending') {
      return res.status(400).json({ success: false, message: 'Hồ sơ của bạn đang trong quá trình xét duyệt. Không thể nộp đơn mới.' });
    }

    user.lenderStatus = 'pending';
    user.lenderOnboarding = {
      cccdFront,
      cccdBack,
      cccdSelfie,
      bankAccount: {
        accountNumber: bankAccount.accountNumber,
        bankName: bankAccount.bankName,
        accountHolder: bankAccount.accountHolder
      },
      rejectReason: ''
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Nộp hồ sơ eKYC đăng ký Lender thành công. Vui lòng quay lại sau khi hồ sơ được phê duyệt.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isProfileCompleted: user.isProfileCompleted,
        lenderStatus: user.lenderStatus,
        lenderOnboarding: user.lenderOnboarding
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLenderApplications = async (req, res) => {
  try {
    const applications = await User.find({ lenderStatus: 'pending' })
      .select('name email phoneNumber address lenderStatus lenderOnboarding createdAt');
    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyLenderApplication = async (req, res) => {
  try {
    const { status, rejectReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái phê duyệt không hợp lệ. Phải là "approved" hoặc "rejected".' });
    }

    if (status === 'rejected' && !rejectReason) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp lý do từ chối hồ sơ.' });
    }

    const applicant = await User.findById(req.params.id);
    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ người dùng.' });
    }

    if (applicant.lenderStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Hồ sơ này không ở trạng thái chờ duyệt.' });
    }

    if (status === 'approved') {
      applicant.lenderStatus = 'approved';
      applicant.role = 'lender';
    } else {
      applicant.lenderStatus = 'rejected';
      applicant.lenderOnboarding.rejectReason = rejectReason;
    }

    await applicant.save();

    res.status(200).json({
      success: true,
      message: status === 'approved' ? 'Phê duyệt hồ sơ Lender thành công. Tài khoản đã được nâng cấp lên Lender.' : 'Đã từ chối hồ sơ Lender.',
      data: {
        _id: applicant._id,
        name: applicant.name,
        email: applicant.email,
        role: applicant.role,
        lenderStatus: applicant.lenderStatus,
        lenderOnboarding: applicant.lenderOnboarding
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    res.status(200).json({
      success: true,
      data: {
        balance: user.balance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createWithdrawal = async (req, res) => {
  try {
    const { amount, bankAccount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Số tiền rút phải lớn hơn 0.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    if (user.balance < amount) {
      return res.status(400).json({ success: false, message: 'Số dư ví không đủ để thực hiện rút số tiền này.' });
    }

    let targetBankAccount = bankAccount;

    // Check if bankAccount is provided, otherwise fall back to eKYC bank account
    if (!targetBankAccount || !targetBankAccount.accountNumber) {
      const ekycBank = user.lenderOnboarding.bankAccount;
      if (ekycBank && ekycBank.accountNumber) {
        targetBankAccount = {
          accountNumber: ekycBank.accountNumber,
          bankName: ekycBank.bankName,
          accountHolder: ekycBank.accountHolder
        };
      } else {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ thông tin tài khoản ngân hàng nhận tiền (bankAccount) gồmAccountNumber, bankName, accountHolder.'
        });
      }
    } else {
      if (!targetBankAccount.accountNumber || !targetBankAccount.bankName || !targetBankAccount.accountHolder) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ thông tin tài khoản ngân hàng nhận tiền (bankAccount) gồmAccountNumber, bankName, accountHolder.'
        });
      }
    }

    // Freeze amount
    user.balance -= amount;
    await user.save();

    const request = await WithdrawalRequest.create({
      lender: user._id,
      amount,
      bankAccount: {
        accountNumber: targetBankAccount.accountNumber,
        bankName: targetBankAccount.bankName,
        accountHolder: targetBankAccount.accountHolder
      },
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Tạo yêu cầu rút tiền thành công. Số tiền rút đã được tạm đóng băng.',
      data: request
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWithdrawals = async (req, res) => {
  try {
    const requests = await WithdrawalRequest.find()
      .populate('lender', 'name email phoneNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyWithdrawal = async (req, res) => {
  try {
    const { status, rejectReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái kiểm duyệt không hợp lệ. Phải là "approved" hoặc "rejected".' });
    }

    if (status === 'rejected' && !rejectReason) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp lý do từ chối yêu cầu rút tiền.' });
    }

    const request = await WithdrawalRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu rút tiền.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Yêu cầu rút tiền này đã được xử lý trước đó.' });
    }

    if (status === 'approved') {
      request.status = 'approved';
    } else {
      request.status = 'rejected';
      request.rejectReason = rejectReason;

      // Refund the frozen amount to the lender's balance
      const lender = await User.findById(request.lender);
      if (lender) {
        lender.balance += request.amount;
        await lender.save();
      }
    }

    await request.save();

    res.status(200).json({
      success: true,
      message: status === 'approved' ? 'Phê duyệt yêu cầu rút tiền thành công.' : 'Từ chối yêu cầu rút tiền thành công và hoàn trả số dư ví.',
      data: request
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user public profile (Personal Page summary)
// @route   GET /api/auth/users/:id/profile
// @access  Public
exports.getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        reputationScore: user.reputationScore,
        isProfileCompleted: user.isProfileCompleted,
        createdAt: user.createdAt,
        ratingsCount: user.ratingsReceived ? user.ratingsReceived.length : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyWithdrawals = async (req, res) => {
  try {
    const requests = await WithdrawalRequest.find({ lender: req.user._id })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ảnh đại diện.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    user.avatar = avatar;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công!',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isProfileCompleted: user.isProfileCompleted,
        lenderStatus: user.lenderStatus,
        lenderOnboarding: user.lenderOnboarding
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
