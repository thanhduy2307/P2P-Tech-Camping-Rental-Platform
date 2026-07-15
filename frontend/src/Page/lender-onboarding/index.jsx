import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../configs/axios';
import { loginSuccess, updateProfile } from '../../redux/authSlice';

const LenderOnboarding = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { user: reduxUser } = useSelector((state) => state.auth);

  // User state
  const [user, setUser] = useState(reduxUser || null);

  // Stepper state
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Step 1: Bank Account Details
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // Step 2: eKYC Documents (File uploads & previews)
  const [cccdFrontFile, setCccdFrontFile] = useState(null);
  const [cccdBackFile, setCccdBackFile] = useState(null);
  const [cccdSelfieFile, setCccdSelfieFile] = useState(null);

  const [cccdFrontPreview, setCccdFrontPreview] = useState('');
  const [cccdBackPreview, setCccdBackPreview] = useState('');
  const [cccdSelfiePreview, setCccdSelfiePreview] = useState('');

  // Checkbox agreement
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Fetch fresh user profile on load to get latest lenderStatus
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!token) return;
      try {
        const response = await api.get('/auth/me');
        if (response.data && response.data.success) {
          const freshUser = response.data.data;
          setUser(freshUser);
          dispatch(updateProfile(freshUser));

          // Pre-fill bank account details if already saved in profile
          if (freshUser.bankAccount) {
            setBankName(freshUser.bankAccount.bankName || '');
            setAccountNumber(freshUser.bankAccount.accountNumber || '');
            setAccountHolder(freshUser.bankAccount.accountHolder || '');
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };
    fetchUserProfile();
  }, [token, dispatch]);

  // Image selection change handlers
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    if (type === 'front') {
      setCccdFrontFile(file);
      setCccdFrontPreview(previewUrl);
    } else if (type === 'back') {
      setCccdBackFile(file);
      setCccdBackPreview(previewUrl);
    } else if (type === 'selfie') {
      setCccdSelfieFile(file);
      setCccdSelfiePreview(previewUrl);
    }
  };

  // Clear previews on unmount
  useEffect(() => {
    return () => {
      if (cccdFrontPreview) URL.revokeObjectURL(cccdFrontPreview);
      if (cccdBackPreview) URL.revokeObjectURL(cccdBackPreview);
      if (cccdSelfiePreview) URL.revokeObjectURL(cccdSelfiePreview);
    };
  }, [cccdFrontPreview, cccdBackPreview, cccdSelfiePreview]);

  // Next / Prev step controllers
  const handleNextStep = () => {
    if (activeStep === 1) {
      if (!bankName || !accountNumber || !accountHolder) {
        setErrorMessage('Vui lòng điền đầy đủ thông tin tài khoản ngân hàng nhận tiền.');
        return;
      }
      setErrorMessage('');
      setActiveStep(2);
    } else if (activeStep === 2) {
      if (!cccdFrontPreview || !cccdBackPreview || !cccdSelfiePreview) {
        setErrorMessage('Vui lòng tải lên đầy đủ hình ảnh CCCD mặt trước, mặt sau và ảnh chụp selfie.');
        return;
      }
      setErrorMessage('');
      setActiveStep(3);
    }
  };

  const handlePrevStep = () => {
    setErrorMessage('');
    setActiveStep((prev) => Math.max(1, prev - 1));
  };

  // Submit lender application
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve('');
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmitApplication = async () => {
    if (!agreedToTerms) {
      setErrorMessage('Bạn cần đồng ý với Điều khoản và Quy chế hoạt động để tiếp tục.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const frontBase64 = await fileToBase64(cccdFrontFile);
      const backBase64 = await fileToBase64(cccdBackFile);
      const selfieBase64 = await fileToBase64(cccdSelfieFile);

      if (!frontBase64 || !backBase64 || !selfieBase64) {
        setErrorMessage('Vui lòng tải lên đầy đủ hình ảnh CCCD mặt trước, mặt sau và ảnh chụp selfie.');
        setLoading(false);
        return;
      }

      const payload = {
        cccdFront: frontBase64,
        cccdBack: backBase64,
        cccdSelfie: selfieBase64,
        bankAccount: {
          accountNumber,
          bankName,
          accountHolder
        }
      };

      const response = await api.post('/auth/lender-onboarding', payload);
      if (response.data && response.data.success) {
        const freshUser = response.data.data;
        setUser(freshUser);
        dispatch(updateProfile(freshUser));
        setSuccessMessage('Nộp đơn đăng ký làm Người cho thuê (Lender) thành công! Đơn đang chờ Admin duyệt.');
        setActiveStep(1); // Reset step counter
        setCccdFrontFile(null);
        setCccdBackFile(null);
        setCccdSelfieFile(null);
        setCccdFrontPreview('');
        setCccdBackPreview('');
        setCccdSelfiePreview('');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage('Đã xảy ra lỗi trong quá trình nộp hồ sơ. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Switch role handler (if approved)
  const handleSwitchRole = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const response = await api.put('/auth/switch-role', { targetRole: user?.role === 'renter' ? 'lender' : 'renter' });
      if (response.data && response.data.success) {
        const { token: newToken, role: newRole, ...userData } = response.data.data;
        dispatch(loginSuccess({
          token: newToken,
          role: newRole,
          user: userData
        }));
        setUser(userData);
        if (newRole === 'lender') {
          navigate('/dashboard-lender');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage('Không thể chuyển đổi vai trò. Vui lòng kiểm tra lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset status to try onboarding again (if rejected)
  const handleResetApplication = () => {
    setUser((prev) => ({
      ...prev,
      lenderStatus: 'none'
    }));
    setActiveStep(1);
    setAgreedToTerms(false);
    setCccdFrontFile(null);
    setCccdBackFile(null);
    setCccdSelfieFile(null);
    setCccdFrontPreview('');
    setCccdBackPreview('');
    setCccdSelfiePreview('');
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl shadow-md text-center">
        <span className="material-symbols-outlined text-5xl text-outline mb-4">lock</span>
        <h2 className="text-xl font-bold mb-2">Vui lòng đăng nhập</h2>
        <p className="text-on-surface-variant text-sm mb-6">Bạn cần đăng nhập bằng tài khoản Renter trước khi đăng ký eKYC Lender.</p>
        <Link to="/login" className="bg-primary text-white px-6 py-2.5 rounded-lg shadow-sm hover:opacity-95 font-semibold transition-all">Đăng nhập ngay</Link>
      </div>
    );
  }

  // 1. If Profile is not Completed, force completing profile first
  if (user && !user.isProfileCompleted) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-outline-variant rounded-2xl shadow-sm text-center space-y-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl font-bold">assignment_ind</span>
        </div>
        <h2 className="text-xl font-extrabold text-on-surface">Yêu cầu hoàn thiện hồ sơ cá nhân</h2>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Theo quy chế của nền tảng, trước khi đăng ký làm <strong>Người cho thuê thiết bị (Lender)</strong>, bạn cần điền đầy đủ các thông tin liên lạc mặc định (bao gồm <strong>Số điện thoại</strong> và <strong>Địa chỉ giao nhận đồ mặc định</strong>).
        </p>
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/50 text-left text-xs text-on-surface-variant space-y-2">
          <p className="font-bold text-on-surface">Thông tin hiện tại của bạn:</p>
          <p>• Số điện thoại: <span className="text-red-600 font-semibold">{user.phoneNumber || 'Chưa cung cấp'}</span></p>
          <p>• Địa chỉ mặc định: <span className="text-red-600 font-semibold">{user.address?.street ? `${user.address.street}, ${user.address.ward || ''}, ${user.address.province || ''}` : 'Chưa cấu hình'}</span></p>
        </div>
        <div className="pt-2">
          <Link to="/profile" className="bg-primary text-white font-bold px-6 py-3 rounded-xl shadow-sm hover:opacity-95 active:scale-95 transition-all text-sm inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">edit</span>
            Đi tới trang Cá nhân để bổ sung
          </Link>
        </div>
      </div>
    );
  }

  // 2. If status is pending review
  if (user && user.lenderStatus === 'pending') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-md text-center space-y-6">
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-amber-50 text-amber-600 rounded-full border border-amber-200">
          <span className="material-symbols-outlined text-4xl animate-pulse">hourglass_top</span>
        </div>
        <h2 className="text-2xl font-extrabold text-on-surface">Hồ sơ eKYC đang được kiểm duyệt</h2>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Đơn đăng ký làm Người cho thuê (Lender) của tài khoản <strong className="text-on-surface">{user.name}</strong> đã được gửi lên hệ thống và đang trong quá trình đối soát chứng thực. Ban quản trị sẽ hoàn thành phê duyệt trong vòng 24 giờ tới.
        </p>
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/50 text-xs text-left space-y-2 text-amber-900">
          <p className="font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">info</span>
            Quy trình phê duyệt gồm:
          </p>
          <p>• Xác thực tính chính xác và nguyên vẹn của ảnh CCCD mặt trước/mặt sau.</p>
          <p>• Kiểm tra ảnh chân dung tự chụp (Selfie) khớp với ảnh trên giấy tờ.</p>
          <p>• Xác nhận tính hợp lệ của tài khoản ngân hàng liên kết nhận thanh toán.</p>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="border border-outline text-on-surface font-semibold px-6 py-2.5 rounded-xl hover:bg-surface-container-low transition-all text-sm">
            Quay lại trang chủ
          </Link>
          <Link to="/profile" className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl shadow hover:opacity-95 transition-all text-sm flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-base">person</span>
            Xem hồ sơ cá nhân
          </Link>
        </div>
      </div>
    );
  }

  // 3. If status is approved
  if (user && user.lenderStatus === 'approved') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-md text-center space-y-6">
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto border border-emerald-200">
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
        </div>
        <h2 className="text-2xl font-extrabold text-on-surface">Tài khoản Lender đã được kích hoạt!</h2>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Hồ sơ đăng ký của bạn đã được kiểm duyệt và phê duyệt thành công. Tài khoản <strong className="text-on-surface">{user.name}</strong> đã chính thức có quyền đăng tin cho thuê thiết bị trên nền tảng.
        </p>

        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/50 text-xs text-left text-emerald-900 space-y-1.5">
          <p className="font-bold">Quyền lợi tài khoản Lender:</p>
          <p>✓ Đăng tin thiết bị không giới hạn (Tents, Cookware, Cameras...).</p>
          <p>✓ Quản lý đơn thuê và chấp nhận thanh toán tự động qua VNPay.</p>
          <p>✓ Nhận doanh thu an toàn, tự động cộng số dư ví tiền mặt dã ngoại.</p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          {user.role !== 'lender' ? (
            <button 
              onClick={handleSwitchRole}
              disabled={loading}
              className="bg-primary text-white font-bold px-6 py-3 rounded-xl shadow-md hover:opacity-95 active:scale-95 transition-all text-sm flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">swap_horiz</span>
              {loading ? 'Đang chuyển đổi...' : 'Chuyển vai trò sang Lender ngay'}
            </button>
          ) : (
            <Link 
              to="/dashboard-lender" 
              className="bg-primary text-white font-bold px-6 py-3 rounded-xl shadow-md hover:opacity-95 active:scale-95 transition-all text-sm flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">dashboard</span>
              Truy cập Lender Dashboard
            </Link>
          )}
          <Link to="/profile" className="border border-outline text-on-surface font-semibold px-6 py-3 rounded-xl hover:bg-surface-container-low transition-all text-sm flex items-center justify-center">
            Xem thông tin ví & STK
          </Link>
        </div>
      </div>
    );
  }

  // 4. If status is rejected
  if (user && user.lenderStatus === 'rejected') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-md text-center space-y-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto border border-red-200">
          <span className="material-symbols-outlined text-4xl">gpp_bad</span>
        </div>
        <h2 className="text-2xl font-extrabold text-on-surface">Yêu cầu eKYC bị từ chối</h2>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Chúng tôi rất tiếc phải thông báo hồ sơ đăng ký làm Người cho thuê (Lender) của bạn đã bị từ chối phê duyệt do không đáp ứng đủ các tiêu chuẩn định danh cần thiết.
        </p>
        
        <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-left text-xs text-red-900 space-y-2">
          <p className="font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">error</span>
            Lý do từ chối cụ thể của Admin:
          </p>
          <div className="bg-white/80 p-3 rounded-lg border border-red-100 font-semibold text-on-surface leading-relaxed italic">
            "{user.lenderOnboarding?.rejectReason || 'Ảnh CCCD bị mờ, không rõ chữ số hoặc ảnh selfie không khớp chân dung.'}"
          </div>
        </div>

        <div className="pt-4 flex justify-center gap-3">
          <button 
            onClick={handleResetApplication}
            className="bg-primary text-white font-bold px-6 py-3 rounded-xl shadow-md hover:opacity-95 active:scale-95 transition-all text-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base font-bold">refresh</span>
            Tạo và gửi lại hồ sơ eKYC mới
          </button>
          <Link to="/profile" className="border border-outline text-on-surface font-semibold px-6 py-3 rounded-xl hover:bg-surface-container-low transition-all text-sm">
            Xem hồ sơ cá nhân
          </Link>
        </div>
      </div>
    );
  }

  // 5. Default Wizard flow (lenderStatus === 'none')
  return (
    <div className="bg-surface text-on-surface min-h-screen antialiased font-body-md py-6">
      <div className="max-w-2xl mx-auto bg-surface-container-lowest border border-outline-variant rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        
        {/* Banner header */}
        <div className="bg-gradient-to-r from-primary to-primary-fixed-dim/60 text-white p-6 md:p-8 text-center relative">
          <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
          <h2 className="text-2xl font-extrabold tracking-tight relative z-10">Đăng ký làm Người cho thuê (Lender)</h2>
          <p className="text-white/85 text-xs mt-1.5 font-medium relative z-10">Hoàn thiện eKYC để liên kết sản phẩm dã ngoại và bắt đầu nhận tiền doanh thu.</p>
        </div>

        {/* Stepper Wizard Progress */}
        <div className="px-6 md:px-8 py-6 bg-surface-container-low border-b border-outline-variant/40 flex justify-between items-center text-xs font-bold text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
              activeStep >= 1 ? 'bg-primary text-white border-primary' : 'border-outline text-outline'
            }`}>1</span>
            <span className={activeStep >= 1 ? 'text-primary font-bold' : ''}>Liên kết ngân hàng</span>
          </div>
          <span className="h-0.5 w-10 bg-outline-variant flex-grow mx-2"></span>
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
              activeStep >= 2 ? 'bg-primary text-white border-primary' : 'border-outline text-outline'
            }`}>2</span>
            <span className={activeStep >= 2 ? 'text-primary font-bold' : ''}>Tải lên eKYC CCCD</span>
          </div>
          <span className="h-0.5 w-10 bg-outline-variant flex-grow mx-2"></span>
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
              activeStep >= 3 ? 'bg-primary text-white border-primary' : 'border-outline text-outline'
            }`}>3</span>
            <span className={activeStep >= 3 ? 'text-primary font-bold' : ''}>Xác nhận & Gửi</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 space-y-6">
          
          {errorMessage && (
            <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 text-xs flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-red-600 font-bold">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 text-xs flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* STEP 1: Bank Account Details */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="bg-primary-container/10 p-4 rounded-2xl border border-primary/10 flex gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">account_balance</span>
                <div>
                  <h4 className="font-bold text-xs text-on-surface">Tài khoản thanh toán nhận tiền</h4>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                    Đây là tài khoản ngân hàng dùng để nhận tiền khi khách thuê thanh toán đơn hàng. Bạn có thể sử dụng thông tin tài khoản mặc định đã lưu trong hồ sơ cá nhân.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Tên ngân hàng liên kết</label>
                  <input 
                    type="text" 
                    placeholder="Ví dụ: Techcombank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Số tài khoản ngân hàng (STK)</label>
                  <input 
                    type="text" 
                    placeholder="Số tài khoản ngân hàng nhận tiền"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Tên chủ tài khoản (In hoa không dấu)</label>
                  <input 
                    type="text" 
                    placeholder="Ví dụ: NGUYEN VAN A"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                    className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none font-semibold"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: eKYC Document Upload */}
          {activeStep === 2 && (
            <div className="space-y-6">
              <div className="bg-primary-container/10 p-4 rounded-2xl border border-primary/10 flex gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">photo_camera</span>
                <div>
                  <h4 className="font-bold text-xs text-on-surface">Cung cấp giấy tờ cá nhân (CCCD)</h4>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                    Yêu cầu tải lên 3 ảnh chụp rõ nét, không bị lóa sáng hay mất góc của Căn cước công dân để được hệ thống xác thực danh tính.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* ID Card Front */}
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-on-surface-variant mb-2">Ảnh CCCD Mặt trước</span>
                  <div className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-outline-variant bg-surface hover:border-primary transition-all relative overflow-hidden flex flex-col items-center justify-center cursor-pointer group">
                    {cccdFrontPreview ? (
                      <img src={cccdFrontPreview} alt="CCCD Front Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-outline text-3xl group-hover:text-primary transition-colors">credit_card</span>
                        <span className="text-[10px] text-outline mt-1.5 font-bold">Tải ảnh lên</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'front')}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* ID Card Back */}
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-on-surface-variant mb-2">Ảnh CCCD Mặt sau</span>
                  <div className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-outline-variant bg-surface hover:border-primary transition-all relative overflow-hidden flex flex-col items-center justify-center cursor-pointer group">
                    {cccdBackPreview ? (
                      <img src={cccdBackPreview} alt="CCCD Back Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-outline text-3xl group-hover:text-primary transition-colors">credit_card</span>
                        <span className="text-[10px] text-outline mt-1.5 font-bold">Tải ảnh lên</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'back')}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Selfie Card */}
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-on-surface-variant mb-2">Ảnh chụp chân dung cầm CCCD</span>
                  <div className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-outline-variant bg-surface hover:border-primary transition-all relative overflow-hidden flex flex-col items-center justify-center cursor-pointer group">
                    {cccdSelfiePreview ? (
                      <img src={cccdSelfiePreview} alt="CCCD Selfie Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-outline text-3xl group-hover:text-primary transition-colors">account_box</span>
                        <span className="text-[10px] text-outline mt-1.5 font-bold">Tải ảnh lên</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'selfie')}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STEP 3: Review and Agree */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="bg-primary-container/10 p-4 rounded-2xl border border-primary/10 flex gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">assignment_turned_in</span>
                <div>
                  <h4 className="font-bold text-xs text-on-surface">Xem lại thông tin hồ sơ đã nộp</h4>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                    Vui lòng rà soát lại thông tin trước khi nộp. Sau khi gửi, hồ sơ sẽ được khóa để chuyển tiếp cho ban quản trị kiểm duyệt.
                  </p>
                </div>
              </div>

              {/* Review summary grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium border border-outline-variant/60 rounded-2xl p-4 bg-surface">
                <div>
                  <span className="block text-on-surface-variant mb-0.5">Tên ngân hàng liên kết:</span>
                  <span className="font-bold text-on-surface">{bankName}</span>
                </div>
                <div>
                  <span className="block text-on-surface-variant mb-0.5">Số tài khoản STK:</span>
                  <span className="font-bold text-on-surface">{accountNumber}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="block text-on-surface-variant mb-0.5">Tên chủ tài khoản:</span>
                  <span className="font-bold text-on-surface">{accountHolder}</span>
                </div>
                <div className="md:col-span-2 border-t border-outline-variant/40 pt-3 mt-1">
                  <span className="block text-on-surface-variant mb-2">Ảnh chứng từ eKYC đã đính kèm:</span>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 font-bold text-[10px]">
                      <span className="material-symbols-outlined text-xs">done</span> CCCD Mặt trước
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 font-bold text-[10px]">
                      <span className="material-symbols-outlined text-xs">done</span> CCCD Mặt sau
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 font-bold text-[10px]">
                      <span className="material-symbols-outlined text-xs">done</span> Ảnh chân dung Selfie
                    </span>
                  </div>
                </div>
              </div>

              {/* Agreement checkbox */}
              <div className="flex items-start gap-2.5 pt-2">
                <input 
                  type="checkbox"
                  id="agreeCheckbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4.5 w-4.5 mt-0.5 cursor-pointer"
                />
                <label htmlFor="agreeCheckbox" className="text-xs text-on-surface-variant cursor-pointer select-none leading-relaxed">
                  Tôi cam kết các thông tin cá nhân cung cấp ở trên là hoàn toàn chính xác và trung thực. Tôi đồng ý tuân thủ toàn bộ <strong>Điều khoản dịch vụ và Quy chế hoạt động</strong> dành cho Lender trên EquipPeer.
                </label>
              </div>
            </div>
          )}

        </div>

        {/* Wizard Footer Actions */}
        <div className="px-6 md:px-8 py-5 bg-surface-container-low border-t border-outline-variant/40 flex justify-between items-center">
          {activeStep > 1 ? (
            <button 
              onClick={handlePrevStep}
              className="border border-outline hover:bg-surface-container text-on-surface font-bold text-xs py-2.5 px-5 rounded-xl transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Quay lại
            </button>
          ) : (
            <Link to="/profile" className="border border-outline hover:bg-surface-container text-on-surface font-semibold text-xs py-2.5 px-5 rounded-xl transition-all">
              Hủy đăng ký
            </Link>
          )}

          {activeStep < 3 ? (
            <button 
              onClick={handleNextStep}
              className="bg-primary text-white font-bold text-xs py-2.5 px-5 rounded-xl hover:opacity-95 shadow-sm active:scale-95 transition-all flex items-center gap-1"
            >
              Tiếp tục
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          ) : (
            <button 
              onClick={handleSubmitApplication}
              disabled={loading}
              className="bg-primary text-white font-bold text-xs py-2.5 px-6 rounded-xl hover:opacity-95 shadow-sm active:scale-[0.97] transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              {loading ? 'Đang gửi hồ sơ...' : 'Nộp hồ sơ ngay'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default LenderOnboarding;
