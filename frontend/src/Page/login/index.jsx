/* global google */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../redux/authSlice';
import api from '../../configs/axios';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data && response.data.success) {
        const { token, role, name, _id, isProfileCompleted } = response.data.data;
        
        // Dispatch to Redux store (saves to state and localStorage)
        dispatch(loginSuccess({
          token,
          role,
          user: { name, email, _id, isProfileCompleted }
        }));

        // Redirect based on role
        if (role === 'admin') {
          navigate('/dashboard-admin');
        } else if (role === 'inspector') {
          navigate('/dashboard-inspector');
        } else if (role === 'lender') {
          navigate('/dashboard-lender');
        } else {
          navigate('/');
        }
      } else {
        setErrorMsg('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        let msg = err.response.data.message;
        if (msg === 'Invalid credentials') {
          msg = 'Email hoặc mật khẩu không chính xác.';
        }
        setErrorMsg(msg);
      } else if (err.response && err.response.status === 401) {
        setErrorMsg('Email hoặc mật khẩu không chính xác.');
      } else {
        setErrorMsg('Đã có lỗi xảy ra. Vui lòng kiểm tra lại kết nối mạng.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (typeof window.google === 'undefined') {
      setErrorMsg('Thư viện Google Sign-In đang được tải. Vui lòng thử lại sau vài giây.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        ux_mode: 'popup',
        callback: async (response) => {
          if (response.error) {
            setErrorMsg(`Đăng nhập bằng Google thất bại: ${response.error}`);
            setLoading(false);
            return;
          }

          if (response.code) {
            try {
              const res = await api.get('/auth/google/callback', {
                params: { code: response.code }
              });

              if (res.data && res.data.success) {
                const { token, role, name, email: userEmail, _id, isProfileCompleted } = res.data.data;

                // Dispatch to Redux store
                dispatch(loginSuccess({
                  token,
                  role,
                  user: { name, email: userEmail, _id, isProfileCompleted }
                }));

                // Redirect based on role
                if (role === 'admin') {
                  navigate('/dashboard-admin');
                } else if (role === 'inspector') {
                  navigate('/dashboard-inspector');
                } else if (role === 'lender') {
                  navigate('/dashboard-lender');
                } else {
                  navigate('/');
                }
              } else {
                setErrorMsg('Xác thực với máy chủ thất bại.');
              }
            } catch (err) {
              console.error(err);
              if (err.response && err.response.data && err.response.data.message) {
                setErrorMsg(err.response.data.message);
              } else {
                setErrorMsg('Không thể đăng nhập bằng Google. Vui lòng thử lại.');
              }
            } finally {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        },
        error_callback: (err) => {
          console.error(err);
          setErrorMsg('Lỗi khởi động Google Sign-In.');
          setLoading(false);
        }
      });

      client.requestCode();
    } catch (err) {
      console.error(err);
      setErrorMsg('Lỗi khởi tạo Google Client.');
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen">
      {/* Left Side: Image Canvas (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface-container-highest overflow-hidden">
        <img 
          alt="EquipPeer Lifestyle" 
          className="absolute inset-0 w-full h-full object-cover" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmwmmzRmMk7kR0Jd-0OS_XGP-qxNfh0xYwqCVp8_Y-IlYpUHj_UYMeFBvn-0WOET2Yg-2dfuDdHmIdozfBCwOSfZZutQJ-AT9Of5yM7k-0oKaA74srwEgvQ9s4CmZpcYjOAPM0CVy6tTPdLszFE4w60WZg0xoh7PURM-CJ-Zr2PiJn9NFtRFkkvRsxKlivqzXcBt2fpIo22k3ROS8y_EKz1FJAFaHr3NCtoALHfF0uxrCB-Hc4vB1qRVILYojrcglCSaRsAJFqz-yv"
        />
        {/* Overlay for text readability if needed in the future, currently just styling */}
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-inverse-surface/20 to-transparent flex flex-col justify-end p-margin-desktop">
          <div className="max-w-md text-surface-container-lowest">
            <p className="font-title-md text-title-md mb-2">Adventure meets Precision.</p>
            <p className="font-body-md text-body-md text-surface-variant">Your premium marketplace for high-end tech and rugged outdoor gear.</p>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form Canvas */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-margin-mobile md:p-margin-desktop bg-surface">
        <div className="w-full max-w-md space-y-8">
          {/* Brand Header */}
          <div className="text-center sm:text-left mb-10">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-6">
              <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>landscape</span>
              <h1 className="font-display-lg text-title-md font-extrabold text-primary tracking-tight">EquipPeer</h1>
            </div>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Chào mừng trở lại!</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Đăng nhập để tiếp tục khám phá và thuê thiết bị.</p>
          </div>

          {errorMsg && (
            <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm font-medium border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* Main Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email / Phone Input */}
            <div className="space-y-2">
              <label className="font-label-sm text-label-sm text-on-surface" htmlFor="email">Email hoặc Số điện thoại</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline">mail</span>
                </div>
                <input 
                  className="w-full pl-10 pr-3 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest focus:ring-2 focus:ring-secondary-container focus:border-secondary-container transition-shadow text-on-surface font-body-md text-body-md" 
                  id="email" 
                  name="email" 
                  placeholder="Email hoặc Số điện thoại" 
                  required 
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="font-label-sm text-label-sm text-on-surface" htmlFor="password">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline">lock</span>
                </div>
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
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface transition-colors" 
                  id="togglePassword" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined" id="toggleIcon">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input 
                  className="h-4 w-4 text-primary focus:ring-primary border-outline-variant rounded" 
                  id="remember-me" 
                  name="remember-me" 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label className="ml-2 block font-body-md text-body-md text-on-surface-variant" htmlFor="remember-me">
                  Ghi nhớ tôi
                </label>
              </div>
              <div className="text-sm">
                <a className="font-label-sm text-label-sm text-secondary font-semibold hover:text-secondary-container transition-colors" href="#">
                  Quên mật khẩu?
                </a>
              </div>
            </div>

            {/* CTA Button */}
            <div>
              <button 
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-on-primary-container bg-primary-container hover:bg-primary-fixed hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 font-label-sm text-label-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed" 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface font-label-sm text-label-sm text-outline">
                  Hoặc đăng nhập với
                </span>
              </div>
            </div>

            {/* Social Logins */}
            <div className="mt-6 w-full">
  <button 
    type="button"
    onClick={handleGoogleLogin}
    disabled={loading}
    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-outline-variant rounded-lg bg-surface-container-lowest hover:bg-surface-container-low transition-colors text-on-surface font-label-sm text-label-sm disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
    </svg>
    Google
  </button>
</div>
          </div>

          {/* Footer Link */}
          <p className="mt-8 text-center font-body-md text-body-md text-on-surface-variant">
            Chưa có tài khoản?{' '}
            <Link className="font-label-sm text-label-sm text-primary hover:text-primary-fixed-dim transition-colors" to="/register">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
