import Swal from 'sweetalert2';
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess, logout } from '../../redux/authSlice';
import api from '../../configs/axios';
import FloatingChat from '../floating-chat';

const DashboardLayout = ({ role, children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const reduxToken = useSelector((state) => state.auth.token);
  const reduxRole = useSelector((state) => state.auth.role);
  const reduxUser = useSelector((state) => state.auth.user);

  const token = reduxToken || localStorage.getItem('token');
  const userRole = reduxRole || localStorage.getItem('role') || 'renter';
  const storedUser = reduxUser || JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleSwitchRole = async () => {
    try {
      const response = await api.put('/auth/switch-role');
      if (response.data && response.data.success) {
        const { token: newToken, role: newRole, ...userData } = response.data.data;
        
        dispatch(loginSuccess({
          token: newToken,
          role: newRole,
          user: userData
        }));
        
        Swal.fire(`Đã chuyển vai trò sang: ${newRole === 'lender' ? 'Người cho thuê (Lender)' : 'Người thuê (Renter)'}`);
        
        if (newRole === 'lender') {
          navigate('/dashboard-lender');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        Swal.fire(err.response.data.message);
      } else {
        Swal.fire('Không thể chuyển vai trò. Vui lòng thử lại sau.');
      }
    }
  };

  // Helper for active link styles
  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-body-md">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shadow-xl z-20">
        {/* Brand/Header */}
        <div className="h-16 flex items-center justify-center border-b border-slate-800 px-6">
          <Link to="/" className="flex items-center gap-2 text-primary-container font-extrabold text-lg tracking-wider text-teal-400">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
            <span>EquipPeer</span>
          </Link>
        </div>

        {/* User Info Capsule */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-teal-400 font-bold text-sm">
              {storedUser.name ? storedUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-200 truncate">{storedUser.name || 'Member'}</p>
              <span className="inline-block text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                {role.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {role === 'admin' && (
            <>
              <Link 
                to="/dashboard-admin" 
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive('/dashboard-admin') ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">dashboard</span>
                Tổng quan
              </Link>
              <Link 
                to="/profile" 
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive('/profile') ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">group</span>
                Thành viên & Vai trò
              </Link>
            </>
          )}
          {role === 'inspector' && (
            <>
              <Link 
                to="/dashboard-inspector" 
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive('/dashboard-inspector') ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">verified</span>
                Kiểm duyệt
              </Link>
            </>
          )}
          {role === 'lender' && (
            <>
              <Link 
                to="/dashboard-lender" 
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive('/dashboard-lender') ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">payments</span>
                Thu nhập của tôi
              </Link>
              <Link 
                to="/lender-inventory" 
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive('/lender-inventory') ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">inventory</span>
                Thiết bị của tôi
              </Link>
              <Link 
                to="/lender-orders" 
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive('/lender-orders') ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                Yêu cầu thuê
              </Link>
              <Link 
                to="/lender-chat" 
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive('/lender-chat') ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">chat</span>
                Hộp thư chat
              </Link>
              <Link 
                to="/post-asset" 
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive('/post-asset') ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                Thêm thiết bị
              </Link>
            </>
          )}
          
          <div className="pt-4 mt-4 border-t border-slate-800">
            <Link 
              to="/" 
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">storefront</span>
              Đến Cửa hàng
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              {isActive('/dashboard-lender') && 'Tổng quan Thu nhập'}
              {isActive('/lender-inventory') && 'Kho Thiết bị của tôi'}
              {isActive('/lender-orders') && 'Đơn hàng cho thuê'}
              {isActive('/post-asset') && 'Đăng thiết bị mới'}
              {!['/dashboard-lender', '/lender-inventory', '/lender-orders', '/post-asset'].includes(location.pathname) && 'Trang Quản trị Lender'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Quick Switch Role inside Dashboard */}
            <button 
              onClick={handleSwitchRole}
              className="text-secondary-container bg-secondary/10 hover:bg-secondary/15 transition-colors px-3 py-1.5 rounded-lg border border-secondary/20 font-semibold text-xs flex items-center gap-1.5 text-secondary"
            >
              <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
              Chuyển sang Renter
            </button>

            <span className="h-4 w-px bg-slate-350"></span>
            
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 transition-colors font-semibold text-xs text-error hover:text-red-700"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-8 flex-grow overflow-y-auto">
          {children}
        </main>
      </div>
      <FloatingChat />
    </div>
  );
};

export default DashboardLayout;
