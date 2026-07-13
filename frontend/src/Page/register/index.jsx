import Swal from 'sweetalert2';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../redux/authSlice';
import api from '../../configs/axios';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [fullname, setFullname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification states
  const [otpVerificationOpen, setOtpVerificationOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verificationUserId, setVerificationUserId] = useState('');
  const [mockOtp, setMockOtp] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Bạn phải đồng ý với Điều khoản dịch vụ & Chính sách bảo mật.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register-phone', {
        name: fullname,
        phoneNumber,
        password,
        role: 'renter'
      });

      if (response.data && response.data.success) {
        const { userId, phoneNumber: uPhone, otp } = response.data.data;
        setVerificationUserId(userId);
        setMockOtp(otp);
        setOtpVerificationOpen(true);
      } else {
        setErrorMsg('Đăng ký số điện thoại thất bại.');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('Số điện thoại đã tồn tại hoặc không hợp lệ.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', {
        userId: verificationUserId,
        otp: otpCode
      });

      if (response.data && response.data.success) {
        const { token, role, name, email: uEmail, phoneNumber: uPhone, _id, isProfileCompleted } = response.data.data;
        
        dispatch(loginSuccess({
          token,
          role,
          user: { name, email: uEmail, phoneNumber: uPhone, _id, isProfileCompleted }
        }));
        
        Swal.fire('Đăng ký tài khoản thành công!');
        navigate('/profile');
      } else {
        setErrorMsg('Xác nhận OTP thất bại.');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('Mã OTP không chính xác hoặc đã hết hạn.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen">
      {/* Left Side: Image Canvas (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface-container-highest overflow-hidden">
        <img 
          alt="EquipPeer Adventure Gear" 
          className="absolute inset-0 w-full h-full object-cover" 
          src="https://lh3.googleusercontent.com/aida/AP1WRLttSf7-B5XqE0wfVz566F_Ay0bXnEKE1Aryb6uRJkEQShT7TjBPz666fOu6YkYGdUk_ytO3G59UsDG9x91d2fwDWO-Da4-moisiS3EACYWM-T8KoYW3NW0bDE4GGc7y_wtba3bw5X5rIQB0MdmmGyYla3rpAKFnHhVWWYw4ShwxTQ5r31v-TVlXbhzekYNKyCpPync04zengdXXbK7dndZcwi6_IJiuz2Tv2v-emb-dkASCBCOIZbSZDH0W"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-inverse-surface/20 to-transparent flex flex-col justify-end p-margin-desktop">
          <div className="max-w-md text-surface-container-lowest">
            <h1 className="font-display-lg text-title-md font-extrabold text-white mb-2 tracking-tight">EquipPeer</h1>
            <p className="font-body-md text-body-md text-surface-variant">Khám phá thế giới, trang bị tận tay. Cộng đồng chia sẻ thiết bị công nghệ và dã ngoại hàng đầu.</p>
          </div>
        </div>
      </div>

      {/* Right Side: Register Form Canvas */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-margin-mobile md:p-margin-desktop bg-surface py-10">
        <div className="w-full max-w-md space-y-6">
          {/* Brand Header */}
          <div className="text-center sm:text-left mb-6">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>landscape</span>
              <h1 className="font-display-lg text-title-md font-extrabold text-primary tracking-tight">EquipPeer</h1>
            </div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Đăng ký tài khoản</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Bắt đầu hành trình chia sẻ và khám phá bằng Số điện thoại.</p>
          </div>

          {errorMsg && (
            <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm font-medium border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* OTP VERIFICATION STEP */}
          {otpVerificationOpen ? (
            <form className="space-y-5" onSubmit={handleVerifyOtp}>
              <div className="text-center bg-slate-50 border border-slate-200 p-4 rounded-xl mb-4">
                <span className="material-symbols-outlined text-amber-500 text-3xl mb-1 animate-pulse">lock_open</span>
                <h4 className="text-xs font-bold text-slate-800">Xác thực OTP số điện thoại</h4>
                <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">
                  Mã xác thực đã được gửi đến số điện thoại: <strong className="text-slate-800">{phoneNumber}</strong>
                </p>
                {mockOtp && (
                  <div className="bg-teal-50 border border-teal-100 text-teal-800 text-[10px] font-bold py-1.5 px-3 rounded-lg mt-3 inline-block">
                    Dành cho Tester: Mã OTP của bạn là: <span className="text-xs font-extrabold font-mono tracking-wider">{mockOtp}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1" htmlFor="otpCode">Nhập mã OTP 6 số</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline-variant">vpn_key</span>
                  </span>
                  <input 
                    className="block w-full pl-10 pr-3 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface placeholder-outline-variant focus:outline-none input-glow transition-all duration-200 text-center font-bold tracking-widest text-lg font-mono" 
                    id="otpCode" 
                    name="otpCode" 
                    placeholder="******" 
                    required 
                    maxLength="6"
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <button 
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm font-label-sm text-label-sm text-white bg-primary-container hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-container transition-all active:scale-[0.98] mt-6 disabled:opacity-50 cursor-pointer" 
                type="submit"
                disabled={loading}
              >
                {loading ? 'ĐANG XÁC THỰC...' : 'XÁC NHẬN OTP'}
              </button>

              <button
                type="button"
                onClick={() => setOtpVerificationOpen(false)}
                className="w-full text-center text-xs text-slate-450 hover:text-slate-650 font-semibold cursor-pointer underline bg-transparent border-none mt-2"
              >
                Quay lại đăng ký
              </button>
            </form>
          ) : (
            /* REGISTRATION FORM */
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="space-y-2">
                <label className="font-label-sm text-label-sm text-on-surface" htmlFor="fullname">Họ và tên</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline">person</span>
                  </span>
                  <input 
                    className="w-full pl-10 pr-3 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container focus:border-secondary-container transition-shadow text-on-surface font-body-md text-body-md" 
                    id="fullname" 
                    name="fullname" 
                    placeholder="Họ và tên của bạn" 
                    required 
                    type="text"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <label className="font-label-sm text-label-sm text-on-surface" htmlFor="phone">Số điện thoại</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline">phone_iphone</span>
                  </span>
                  <input 
                    className="w-full pl-10 pr-3 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container focus:border-secondary-container transition-shadow text-on-surface font-body-md text-body-md" 
                    id="phone" 
                    name="phone" 
                    placeholder="Số điện thoại của bạn" 
                    required 
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="font-label-sm text-label-sm text-on-surface" htmlFor="password">Mật khẩu</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline">lock</span>
                  </span>
                  <input 
                    className="w-full pl-10 pr-10 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container focus:border-secondary-container transition-shadow text-on-surface font-body-md text-body-md" 
                    id="password" 
                    name="password" 
                    placeholder="••••••••" 
                    required 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    aria-label="Toggle password visibility" 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface transition-colors cursor-pointer bg-transparent border-none" 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="font-label-sm text-label-sm text-on-surface" htmlFor="confirm_password">Xác nhận mật khẩu</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline">lock_reset</span>
                  </span>
                  <input 
                    className="w-full pl-10 pr-10 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container focus:border-secondary-container transition-shadow text-on-surface font-body-md text-body-md" 
                    id="confirm_password" 
                    name="confirm_password" 
                    placeholder="••••••••" 
                    required 
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start mt-4">
                <div className="flex items-center h-5">
                  <input 
                    className="focus:ring-primary h-4 w-4 text-primary border-outline-variant rounded bg-surface-container-lowest cursor-pointer" 
                    id="terms" 
                    name="terms" 
                    required 
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label className="font-body-md text-body-md text-on-surface-variant text-sm cursor-pointer" htmlFor="terms">
                    Tôi đồng ý với <a className="text-secondary font-medium hover:underline" href="#">Điều khoản Dịch vụ</a> và <a className="text-secondary font-medium hover:underline" href="#">Chính sách Bảo mật</a>.
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm font-label-sm text-label-sm text-white bg-primary-container hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-container transition-all active:scale-[0.98] mt-6 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
                type="submit"
                disabled={loading}
              >
                {loading ? 'ĐANG ĐĂNG KÝ...' : 'ĐĂNG KÝ'}
              </button>
            </form>
          )}

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="font-body-md text-body-md text-on-surface-variant text-sm">
              Đã có tài khoản?{' '}
              <Link className="font-medium text-secondary hover:text-secondary-container transition-colors" to="/login">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
