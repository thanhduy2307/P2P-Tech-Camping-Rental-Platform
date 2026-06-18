import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../redux/authSlice';
import api from '../../configs/axios';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
      // Calling register API with default role 'renter'
      const response = await api.post('/auth/register', {
        name: fullname,
        email,
        password,
        role: 'renter'
      });

      if (response.data && response.data.success) {
        const { token, role, name, _id, isProfileCompleted } = response.data.data;
        
        // Dispatch to Redux store to auto-login the user
        dispatch(loginSuccess({
          token,
          role,
          user: { name, email, _id, isProfileCompleted }
        }));

        // Redirect to profile page to complete profile info (Phone, GPS)
        navigate('/profile');
      } else {
        setErrorMsg('Đăng ký thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('Email đã tồn tại hoặc dữ liệu đăng ký không hợp lệ.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex items-center justify-center p-4 md:p-0">
      <div className="flex flex-col md:flex-row w-full max-w-[1440px] md:h-screen bg-surface-container-lowest overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        {/* Left Side: Image / Brand Story */}
        <div className="hidden md:flex md:w-1/2 relative bg-surface-container-high">
          <img 
            alt="EquipPeer Adventure Gear" 
            className="absolute inset-0 w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida/AP1WRLttSf7-B5XqE0wfVz566F_Ay0bXnEKE1Aryb6uRJkEQShT7TjBPz666fOu6YkYGdUk_ytO3G59UsDG9x91d2fwDWO-Da4-moisiS3EACYWM-T8KoYW3NW0bDE4GGc7y_wtba3bw5X5rIQB0MdmmGyYla3rpAKFnHhVWWYw4ShwxTQ5r31v-TVlXbhzekYNKyCpPync04zengdXXbK7dndZcwi6_IJiuz2Tv2v-emb-dkASCBCOIZbSZDH0W"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-12 text-white z-10 w-full">
            <h1 className="font-display-lg text-display-lg text-white mb-4 shadow-sm">EquipPeer</h1>
            <p className="font-body-lg text-body-lg text-white/90 max-w-md">Khám phá thế giới, trang bị tận tay. Cộng đồng chia sẻ thiết bị công nghệ và dã ngoại hàng đầu.</p>
            <div className="mt-8 flex gap-4">
              <span className="glass-panel px-4 py-2 rounded-full font-label-sm text-label-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">camping</span>
                Dã ngoại
              </span>
              <span className="glass-panel px-4 py-2 rounded-full font-label-sm text-label-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">photo_camera</span>
                Công nghệ
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24 bg-surface-container-lowest relative">
          {/* Mobile Brand Logo (Visible only on mobile) */}
          <div className="md:hidden flex justify-center mb-8">
            <span className="font-title-md text-title-md font-bold text-primary">EquipPeer</span>
          </div>
          
          <div className="w-full max-w-md mx-auto">
            <div className="mb-8 text-center md:text-left">
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Đăng ký tài khoản</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Bắt đầu hành trình chia sẻ và khám phá của bạn.</p>
            </div>

            {errorMsg && (
              <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm font-medium border border-red-200 mb-4">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1" htmlFor="fullname">Họ và tên</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline-variant">person</span>
                  </span>
                  <input 
                    className="block w-full pl-10 pr-3 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface placeholder-outline-variant focus:outline-none input-glow transition-all duration-200" 
                    id="fullname" 
                    name="fullname" 
                    placeholder="Nguyễn Văn A" 
                    required 
                    type="text"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1" htmlFor="email">Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline-variant">mail</span>
                  </span>
                  <input 
                    className="block w-full pl-10 pr-3 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface placeholder-outline-variant focus:outline-none input-glow transition-all duration-200" 
                    id="email" 
                    name="email" 
                    placeholder="nguyenvana@example.com" 
                    required 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1" htmlFor="password">Mật khẩu</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline-variant">lock</span>
                  </span>
                  <input 
                    className="block w-full pl-10 pr-10 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface placeholder-outline-variant focus:outline-none input-glow transition-all duration-200" 
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
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline-variant hover:text-on-surface transition-colors" 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1" htmlFor="confirm_password">Xác nhận mật khẩu</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline-variant">lock_reset</span>
                  </span>
                  <input 
                    className="block w-full pl-10 pr-10 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface placeholder-outline-variant focus:outline-none input-glow transition-all duration-200" 
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
                    className="focus:ring-primary h-4 w-4 text-primary border-outline-variant rounded rounded-sm bg-surface-container-lowest" 
                    id="terms" 
                    name="terms" 
                    required 
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label className="font-body-md text-body-md text-on-surface-variant text-sm" htmlFor="terms">
                    Tôi đồng ý với <a className="text-secondary font-medium hover:underline" href="#">Điều khoản Dịch vụ</a> và <a className="text-secondary font-medium hover:underline" href="#">Chính sách Bảo mật</a>.
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm font-label-sm text-label-sm text-white bg-primary-container hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-container transition-all active:scale-[0.98] mt-6 disabled:opacity-50 disabled:cursor-not-allowed" 
                type="submit"
                disabled={loading}
              >
                {loading ? 'ĐANG ĐĂNG KÝ...' : 'ĐĂNG KÝ'}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-surface-container-lowest text-outline font-body-md text-sm">Hoặc đăng ký bằng</span>
                </div>
              </div>
            </div>

            {/* Social Sign In */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-label-sm text-label-sm hover:bg-surface-container-low transition-colors shadow-sm" type="button">
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                Google
              </button>
              <button className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-label-sm text-label-sm hover:bg-surface-container-low transition-colors shadow-sm" type="button">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.365 7.172c-.059 2.508-2.096 4.542-4.538 4.484-.055-2.484 2.015-4.54 4.538-4.484zM16.924 12.39c-2.31.062-4.108 1.488-5.32 1.488-1.282 0-3.08-1.426-5.118-1.426-3.058 0-5.836 1.776-7.404 4.488-3.176 5.485-1.074 13.605 2.03 18.064 1.492 2.138 3.228 4.49 5.568 4.425 2.228-.06 3.09-1.425 5.76-1.425 2.674 0 3.468 1.425 5.82 1.365 2.408-.06 3.896-2.196 5.388-4.364 1.734-2.518 2.45-4.962 2.484-5.087-.058-.024-4.735-1.815-4.685-7.527.042-4.79 3.935-6.666 4.126-6.786-2.225-3.23-5.694-3.666-6.953-3.738-2.956-.307-5.748 1.724-7.25 1.724-1.5 0-3.83-1.664-6.264-1.616" transform="translate(0 -5.172) scale(.923)"></path>
                </svg>
                Apple
              </button>
            </div>
          </div>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
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
