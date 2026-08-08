import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../configs/axios';

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { phoneNumber: phone });
      if (res.data && res.data.success) {
        setUserId(res.data.data.userId);
        setStep(2);
      } else {
        setErrorMsg('Không thể gửi mã OTP. Vui lòng thử lại.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { userId, otp, newPassword });
      if (res.data && res.data.success) {
        setSuccessMsg('Mật khẩu đã được đặt lại thành công!');
        setStep(3);
      } else {
        setErrorMsg('Không thể đặt lại mật khẩu.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface-container-highest overflow-hidden">
        <img alt="EquipPeer" className="absolute inset-0 w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmwmmzRmMk7kR0Jd-0OS_XGP-qxNfh0xYwqCVp8_Y-IlYpUHj_UYMeFBvn-0WOET2Yg-2dfuDdHmIdozfBCwOSfZZutQJ-AT9Of5yM7k-0oKaA74srwEgvQ9s4CmZpcYjOAPM0CVy6tTPdLszFE4w60WZg0xoh7PURM-CJ-Zr2PiJn9NFtRFkkvRsxKlivqzXcBt2fpIo22k3ROS8y_EKz1FJAFaHr3NCtoALHfF0uxrCB-Hc4vB1qRVILYojrcglCSaRsAJFqz-yv"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-inverse-surface/20 to-transparent flex flex-col justify-end p-margin-desktop">
          <div className="max-w-md text-surface-container-lowest">
            <p className="font-title-md text-title-md mb-2">Adventure meets Precision.</p>
            <p className="font-body-md text-body-md text-surface-variant">Your premium marketplace for high-end tech and rugged outdoor gear.</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-margin-mobile md:p-margin-desktop bg-surface">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center sm:text-left mb-10">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-6">
              <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>landscape</span>
              <h1 className="font-display-lg text-title-md font-extrabold text-primary tracking-tight">EquipPeer</h1>
            </div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
              {step === 1 ? 'Quên mật khẩu' : step === 2 ? 'Nhập mã OTP' : 'Hoàn tất'}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {step === 1
                ? 'Nhập số điện thoại để nhận mã đặt lại mật khẩu.'
                : step === 2
                ? 'Nhập mã OTP vừa được gửi đến số điện thoại của bạn và tạo mật khẩu mới.'
                : 'Bạn đã đặt lại mật khẩu thành công.'}
            </p>
          </div>

          {errorMsg && (
            <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm font-medium border border-red-200">{errorMsg}</div>
          )}
          {successMsg && (
            <div className="bg-green-100 text-green-800 p-3 rounded-lg text-sm font-medium border border-green-200">{successMsg}</div>
          )}

          {step === 1 && (
            <form className="space-y-6" onSubmit={handleSendOtp}>
              <div className="space-y-2">
                <label className="font-label-sm text-label-sm text-on-surface" htmlFor="phone">Số điện thoại</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline">phone</span>
                  </div>
                  <input className="w-full pl-10 pr-3 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container focus:border-secondary-container transition-shadow text-on-surface font-body-md text-body-md"
                    id="phone" name="phone" placeholder="09xxxxxxxx" required type="tel"
                    value={phone} onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <button type="submit" disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-on-primary-container bg-primary-container hover:bg-primary-fixed hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 font-label-sm text-label-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div className="space-y-2">
                <label className="font-label-sm text-label-sm text-on-surface" htmlFor="otp">Mã OTP</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline">pin</span>
                  </div>
                  <input className="w-full pl-10 pr-3 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container focus:border-secondary-container transition-shadow text-on-surface font-body-md text-body-md"
                    id="otp" name="otp" placeholder="6 chữ số" required type="text" inputMode="numeric" maxLength={6}
                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-sm text-label-sm text-on-surface" htmlFor="newPassword">Mật khẩu mới</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline">lock</span>
                  </div>
                  <input className="w-full pl-10 pr-10 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container focus:border-secondary-container transition-shadow text-on-surface font-body-md text-body-md"
                    id="newPassword" name="newPassword" placeholder="••••••••" required type={showPassword ? "text" : "password"} minLength={6}
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button type="button" aria-label="Toggle visibility"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface transition-colors"
                    onClick={() => setShowPassword(!showPassword)}>
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-sm text-label-sm text-on-surface" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline">lock</span>
                  </div>
                  <input className="w-full pl-10 pr-3 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container focus:border-secondary-container transition-shadow text-on-surface font-body-md text-body-md"
                    id="confirmPassword" name="confirmPassword" placeholder="••••••••" required type="password" minLength={6}
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <button type="submit" disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-on-primary-container bg-primary-container hover:bg-primary-fixed hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 font-label-sm text-label-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                  <span className="material-symbols-outlined text-sm">key</span>
                </button>
              </div>
              <div className="text-center">
                <button type="button" onClick={handleSendOtp} disabled={loading}
                  className="font-label-sm text-label-sm text-secondary font-semibold hover:text-secondary-container transition-colors bg-transparent border-none cursor-pointer">
                  Gửi lại mã OTP
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <span className="material-symbols-outlined text-6xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <p className="font-body-md text-body-md text-on-surface-variant">Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.</p>
              <Link to="/login"
                className="inline-flex items-center gap-2 py-3 px-6 border border-transparent rounded-lg shadow-sm text-on-primary-container bg-primary-container hover:bg-primary-fixed transition-all duration-200 font-label-sm text-label-sm uppercase tracking-wider">
                Đăng nhập
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          )}

          {step !== 3 && (
            <p className="mt-8 text-center font-body-md text-body-md text-on-surface-variant">
              <Link className="font-label-sm text-label-sm text-primary hover:text-primary-fixed-dim transition-colors" to="/login">
                Quay lại đăng nhập
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
