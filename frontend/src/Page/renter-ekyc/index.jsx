import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../configs/axios';
import { updateProfile } from '../../redux/authSlice';

const RenterEkyc = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { user: reduxUser } = useSelector((state) => state.auth);

  // User state
  const [user, setUser] = useState(reduxUser || null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // eKYC Documents (File uploads & previews)
  const [cccdFrontFile, setCccdFrontFile] = useState(null);
  const [cccdBackFile, setCccdBackFile] = useState(null);
  const [cccdSelfieFile, setCccdSelfieFile] = useState(null);

  const [cccdFrontPreview, setCccdFrontPreview] = useState('');
  const [cccdBackPreview, setCccdBackPreview] = useState('');
  const [cccdSelfiePreview, setCccdSelfiePreview] = useState('');

  // Checkbox agreement
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Fetch fresh user profile on load to get latest renterStatus
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!token) return;
      try {
        const response = await api.get('/auth/me');
        if (response.data && response.data.success) {
          const freshUser = response.data.data;
          setUser(freshUser);
          dispatch(updateProfile(freshUser));
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

  // Submit renter application
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

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setErrorMessage('Bạn cần đồng ý với điều khoản cam kết để tiếp tục.');
      return;
    }

    if (!cccdFrontPreview || !cccdBackPreview || !cccdSelfiePreview) {
      setErrorMessage('Vui lòng tải lên đầy đủ hình ảnh CCCD mặt trước, mặt sau và ảnh chụp selfie.');
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
        setErrorMessage('Có lỗi xảy ra khi xử lý hình ảnh. Vui lòng tải lại ảnh.');
        setLoading(false);
        return;
      }

      const payload = {
        cccdFront: frontBase64,
        cccdBack: backBase64,
        cccdSelfie: selfieBase64
      };

      const response = await api.post('/auth/renter-onboarding', payload);
      if (response.data && response.data.success) {
        const freshUser = response.data.data;
        setUser(freshUser);
        dispatch(updateProfile(freshUser));
        setSuccessMessage('Nộp đơn xác thực Renter eKYC thành công! Đang chờ Admin duyệt.');
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

  // Reset status to try onboarding again (if rejected)
  const handleResetApplication = () => {
    setUser((prev) => ({
      ...prev,
      renterStatus: 'none'
    }));
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
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl shadow-md text-center border border-slate-200">
        <span className="material-symbols-outlined text-5xl text-red-500 mb-4">lock</span>
        <h2 className="text-xl font-bold mb-2">Vui lòng đăng nhập</h2>
        <p className="text-slate-500 text-sm mb-6">Bạn cần đăng nhập tài khoản Renter trước khi xác thực danh tính eKYC.</p>
        <Link to="/login" className="bg-primary text-white px-6 py-2.5 rounded-lg shadow-sm hover:opacity-95 font-semibold transition-all">Đăng nhập ngay</Link>
      </div>
    );
  }

  // 1. If Profile is not Completed, force completing profile first
  if (user && !user.isProfileCompleted) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl font-bold">assignment_ind</span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-800">Yêu cầu hoàn thiện hồ sơ cá nhân</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          Trước khi đăng ký xác thực danh tính **CCCD (Renter eKYC)**, bạn cần điền đầy đủ các thông tin cá nhân cơ bản (bao gồm **Số điện thoại** và **Địa chỉ mặc định**).
        </p>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs text-slate-650 space-y-2">
          <p className="font-bold text-slate-800">Thông tin hiện tại của bạn:</p>
          <p>• Số điện thoại: <span className="text-red-650 font-semibold">{user.phoneNumber || 'Chưa cung cấp'}</span></p>
          <p>• Địa chỉ mặc định: <span className="text-red-650 font-semibold">{user.address?.street ? `${user.address.street}, ${user.address.ward || ''}, ${user.address.province || ''}` : 'Chưa cấu hình'}</span></p>
        </div>
        <div className="pt-2">
          <Link to="/profile" className="bg-primary text-white font-bold px-6 py-3 rounded-xl shadow-sm hover:opacity-95 active:scale-95 transition-all text-sm inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">edit</span>
            Bổ sung thông tin ngay
          </Link>
        </div>
      </div>
    );
  }

  // 2. If status is pending review
  if (user && user.renterStatus === 'pending') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-slate-200 rounded-2xl shadow-md text-center space-y-6">
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-amber-50 text-amber-600 rounded-full border border-amber-200">
          <span className="material-symbols-outlined text-4xl animate-pulse">hourglass_top</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800">Hồ sơ đang chờ duyệt eKYC</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          Hồ sơ xác thực danh tính Renter của tài khoản <strong className="text-slate-800">{user.name}</strong> đã được nộp thành công và đang chờ Admin phê duyệt. Quá trình kiểm định sẽ hoàn thành trong vòng 24 giờ.
        </p>
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/50 text-xs text-left space-y-2 text-amber-900">
          <p className="font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">info</span>
            Nội dung kiểm tra bao gồm:
          </p>
          <p>• Tính rõ nét, không mờ nhòe của ảnh mặt trước và mặt sau CCCD.</p>
          <p>• Ảnh chân dung selfie khớp khuôn mặt với ảnh trên CCCD.</p>
          <p>• Không có dấu hiệu chỉnh sửa ảnh kỹ thuật số.</p>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="border border-slate-200 text-slate-700 font-semibold px-6 py-2.5 rounded-xl hover:bg-slate-50 transition-all text-sm">
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
  if (user && user.renterStatus === 'approved') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-slate-200 rounded-2xl shadow-md text-center space-y-6">
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto border border-emerald-200">
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800">Xác thực danh tính thành công!</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          Tài khoản <strong className="text-slate-800">{user.name}</strong> đã hoàn thành xác thực CCCD (eKYC). Bạn đã được cấp đầy đủ quyền đặt thuê tất cả các thiết bị trên hệ thống.
        </p>

        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/50 text-xs text-left text-emerald-950 space-y-1.5">
          <p className="font-bold">Tính năng đã kích hoạt:</p>
          <p>✓ Đặt thuê đồ cắm trại & đồ công nghệ trên sàn.</p>
          <p>✓ Thanh toán trực tuyến và hưởng ưu đãi giảm cọc dựa trên điểm uy tín.</p>
          <p>✓ Có thể nâng cấp trực tiếp lên quyền **Lender** bằng cách liên kết tài khoản ngân hàng nhận tiền mà không cần chụp lại CCCD.</p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            to="/" 
            className="bg-primary text-white font-bold px-6 py-3 rounded-xl shadow-md hover:opacity-95 active:scale-95 transition-all text-sm flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">storefront</span>
            Khám phá thiết bị thuê ngay
          </Link>
          <Link to="/lender-onboarding" className="border border-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 transition-all text-sm flex items-center justify-center">
            Đăng ký làm Lender
          </Link>
        </div>
      </div>
    );
  }

  // 4. If status is rejected
  if (user && user.renterStatus === 'rejected') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-slate-200 rounded-2xl shadow-md text-center space-y-6">
        <div className="bg-red-50 text-red-650 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto border border-red-200">
          <span className="material-symbols-outlined text-4xl">gpp_bad</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800">Yêu cầu xác thực bị từ chối</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          Hồ sơ eKYC xác thực CCCD của bạn đã bị từ chối do không đáp ứng đủ các tiêu chí hiển thị thông tin rõ nét hoặc không khớp chân dung thực tế.
        </p>
        
        <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-left text-xs text-red-950 space-y-2">
          <p className="font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">error</span>
            Lý do từ chối từ Ban quản trị:
          </p>
          <div className="bg-white/80 p-3 rounded-lg border border-red-100 font-semibold text-slate-850 leading-relaxed italic">
            "{user.renterOnboarding?.rejectReason || 'Ảnh CCCD bị mờ, lóa hoặc ảnh chân dung tự chụp cầm giấy tờ không khớp mặt.'}"
          </div>
        </div>

        <div className="pt-4 flex justify-center gap-3">
          <button 
            onClick={handleResetApplication}
            className="bg-primary text-white font-bold px-6 py-3 rounded-xl shadow-md hover:opacity-95 active:scale-95 transition-all text-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Nộp lại hồ sơ eKYC mới
          </button>
          <Link to="/" className="border border-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 transition-all text-sm">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // 5. Default flow (status is none)
  return (
    <div className="bg-slate-50 min-h-screen py-8 text-slate-800">
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 md:p-8 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight">Xác Thực Danh Tính Renter (eKYC)</h2>
          <p className="text-slate-400 text-xs mt-2 font-medium">Bắt buộc thực hiện eKYC để kích hoạt quyền đặt thuê sản phẩm trên EquipPeer.</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitApplication} className="p-6 md:p-8 space-y-6">
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

          {/* Description banner */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex gap-3">
            <span className="material-symbols-outlined text-slate-600 text-2xl">photo_camera</span>
            <div>
              <h4 className="font-bold text-xs text-slate-800">Cung cấp giấy tờ định danh</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Vui lòng tải lên 3 hình ảnh chụp rõ nét (Mặt trước CCCD, Mặt sau CCCD và Ảnh chân dung bạn cầm CCCD). Hãy đảm bảo ảnh đủ sáng, rõ mặt và rõ chữ số trên thẻ.
              </p>
            </div>
          </div>

          {/* Upload Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            {/* CCCD Front */}
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold text-slate-600 mb-2">CCCD Mặt trước <span className="text-red-500">*</span></span>
              <div className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-teal-500 transition-all relative overflow-hidden flex flex-col items-center justify-center cursor-pointer group">
                {cccdFrontPreview ? (
                  <img src={cccdFrontPreview} alt="CCCD Front Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-slate-400 text-2xl group-hover:text-teal-500 transition-colors">credit_card</span>
                    <span className="text-[10px] text-slate-400 mt-1 font-bold">Chọn ảnh</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'front')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  required
                />
              </div>
            </div>

            {/* CCCD Back */}
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold text-slate-600 mb-2">CCCD Mặt sau <span className="text-red-500">*</span></span>
              <div className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-teal-500 transition-all relative overflow-hidden flex flex-col items-center justify-center cursor-pointer group">
                {cccdBackPreview ? (
                  <img src={cccdBackPreview} alt="CCCD Back Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-slate-400 text-2xl group-hover:text-teal-500 transition-colors">credit_card</span>
                    <span className="text-[10px] text-slate-400 mt-1 font-bold">Chọn ảnh</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'back')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  required
                />
              </div>
            </div>

            {/* CCCD Selfie */}
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold text-slate-600 mb-2">Ảnh Selfie cầm CCCD <span className="text-red-500">*</span></span>
              <div className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-teal-500 transition-all relative overflow-hidden flex flex-col items-center justify-center cursor-pointer group">
                {cccdSelfiePreview ? (
                  <img src={cccdSelfiePreview} alt="CCCD Selfie Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-slate-400 text-2xl group-hover:text-teal-500 transition-colors">account_box</span>
                    <span className="text-[10px] text-slate-400 mt-1 font-bold">Chọn ảnh</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'selfie')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  required
                />
              </div>
            </div>

          </div>

          {/* Agreement terms */}
          <div className="flex items-start gap-3 border-t border-slate-100 pt-6">
            <input 
              type="checkbox"
              id="agreeRenterTerms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4 mt-0.5 cursor-pointer"
              required
            />
            <label htmlFor="agreeRenterTerms" className="text-xs text-slate-500 cursor-pointer select-none leading-relaxed">
              Tôi cam kết các ảnh chụp giấy tờ CCCD định danh trên là của chính tôi, hoàn toàn trung thực và chịu trách nhiệm trước pháp luật khi có hành vi giả mạo thông tin. Tôi đồng ý tuân thủ **Quy chế hoạt động thuê đồ dã ngoại** của EquipPeer.
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 pt-6">
            <Link to="/" className="border border-slate-200 hover:bg-slate-55 text-slate-700 font-bold text-xs py-2.5 px-5 rounded-xl transition-all">
              Hủy bỏ
            </Link>
            <button 
              type="submit"
              disabled={loading}
              className="bg-primary text-white font-bold text-xs py-2.5 px-6 rounded-xl hover:opacity-95 shadow-sm active:scale-[0.98] transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              {loading ? 'Đang gửi hồ sơ...' : 'Gửi yêu cầu xác thực'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default RenterEkyc;
