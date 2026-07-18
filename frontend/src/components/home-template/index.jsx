import Swal from 'sweetalert2';
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess, logout } from '../../redux/authSlice';
import api from '../../configs/axios';
import AIChatbot from '../chatbot';
import FloatingChat from '../floating-chat';

const HomeTemplate = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const reduxToken = useSelector((state) => state.auth.token);
  const reduxRole = useSelector((state) => state.auth.role);
  const reduxUser = useSelector((state) => state.auth.user);

  const token = reduxToken || localStorage.getItem('token');
  const role = reduxRole || localStorage.getItem('role') || 'renter';
  const storedUser = reduxUser || JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const [showChatDropdown, setShowChatDropdown] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const chatDropdownRef = useRef(null);

  const fetchConversationsDropdown = async () => {
    if (!token) return;
    setLoadingConversations(true);
    try {
      const response = await api.get('/chats/conversations');
      if (response.data?.success) {
        setConversations(response.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch conversations for dropdown:", err);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Notifications State
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationDropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!token) return;
    setLoadingNotifications(true);
    try {
      const response = await api.get('/notifications');
      if (response.data?.success) {
        setNotifications(response.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await api.put(`/notifications/${notification._id}/read`);
        setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
      }
      setShowNotificationDropdown(false);
      if (notification.link) {
        navigate(notification.link);
      }
    } catch (err) {
      console.error("Error clicking notification:", err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatDropdownRef.current && !chatDropdownRef.current.contains(event.target)) {
        setShowChatDropdown(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll conversations and notifications status every 10s
  useEffect(() => {
    if (!token) return;
    const fetchUnreadStatus = async () => {
      try {
        const chatRes = await api.get('/chats/conversations');
        if (chatRes.data?.success) setConversations(chatRes.data.data || []);

        const notifRes = await api.get('/notifications');
        if (notifRes.data?.success) setNotifications(notifRes.data.data || []);
      } catch (err) {
        console.error("Failed to poll status:", err);
      }
    };
    fetchUnreadStatus();
    const interval = setInterval(fetchUnreadStatus, 10000);
    return () => clearInterval(interval);
  }, [token]);

  // Sync when conversations change from other sources
  useEffect(() => {
    if (!token) return;
    const handleSync = async () => {
      try {
        const response = await api.get('/chats/conversations');
        if (response.data?.success) {
          setConversations(response.data.data || []);
        }
      } catch (err) {
        console.error("Sync error in dropdown:", err);
      }
    };
    window.addEventListener('conversation-updated', handleSync);
    return () => window.removeEventListener('conversation-updated', handleSync);
  }, [token]);

  const handleSwitchRole = async () => {
    try {
      const response = await api.put('/auth/switch-role', { targetRole: role === 'renter' ? 'lender' : 'renter' });
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

  useEffect(() => {
    const handleScroll = () => {
      const nav = document.getElementById('main-nav');
      if (nav) {
        if (window.scrollY > 20) {
          nav.classList.add('shadow-md');
          nav.classList.remove('shadow-sm');
          nav.style.backgroundColor = 'rgba(248, 250, 252, 0.9)';
        } else {
          nav.classList.add('shadow-sm');
          nav.classList.remove('shadow-md');
          nav.style.backgroundColor = 'rgba(248, 250, 252, 0.7)';
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col">
      {/* TopNavBar */}
      <nav 
        id="main-nav" 
        className="bg-surface/70 backdrop-blur-xl fixed top-0 w-full z-50 shadow-sm transition-all duration-300"
      >
        <div className="flex items-center justify-between px-margin-desktop py-4 max-w-container-max mx-auto h-[72px]">
          {/* Brand & Search */}
          <div className="flex items-center gap-8">
            <Link to="/" className="font-display-lg text-title-md font-extrabold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
              EquipPeer
            </Link>
            <div className="hidden md:flex items-center bg-surface-container-low rounded-full px-4 py-2 border border-outline-variant/30 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="material-symbols-outlined text-outline mr-2 text-[20px]">search</span>
              <input 
                className="bg-transparent border-none focus:outline-none text-body-md text-on-surface w-[200px] lg:w-[300px] placeholder-outline" 
                placeholder="Tìm kiếm thiết bị..." 
                type="text"
              />
            </div>
          </div>
          {/* Navigation Links */}
          <ul className="hidden md:flex items-center gap-6">
            <li><Link to="/assets?category=tech" className="text-on-surface-variant hover:text-primary transition-colors font-title-md text-[16px] font-medium">Đồ công nghệ</Link></li>
            <li><Link to="/assets?category=camping" className="text-on-surface-variant hover:text-primary transition-colors font-title-md text-[16px] font-medium">Cắm trại</Link></li>
            <li><Link to="/blogs" className="text-on-surface-variant hover:text-primary transition-colors font-title-md text-[16px] font-medium">Blogs</Link></li>
            {token && role === 'admin' && (
              <li><Link to="/dashboard-admin" className="text-on-surface-variant hover:text-primary transition-colors font-title-md text-[16px] font-medium">Trang Quản trị</Link></li>
            )}
            {token && role === 'inspector' && (
              <li><Link to="/dashboard-inspector" className="text-on-surface-variant hover:text-primary transition-colors font-title-md text-[16px] font-medium">Trang Kiểm duyệt</Link></li>
            )}
            {token && role === 'lender' && (
              <li><Link to="/dashboard-lender" className="text-on-surface-variant hover:text-primary transition-colors font-title-md text-[16px] font-medium">Kênh Cho thuê</Link></li>
            )}
          </ul>
          {/* Actions */}
          <div className="flex items-center gap-4">
            {token ? (
              <div className="hidden md:flex items-center gap-3">

                <Link to="/orders" className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-low">
                  <span className="material-symbols-outlined">shopping_bag</span>
                </Link>

                {/* Notifications Dropdown */}
                <div className="relative flex items-center" ref={notificationDropdownRef}>
                  <button 
                    onClick={() => {
                      if (!showNotificationDropdown) {
                        fetchNotifications();
                      }
                      setShowNotificationDropdown(!showNotificationDropdown);
                      setShowChatDropdown(false);
                    }}
                    className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-low flex items-center justify-center relative cursor-pointer"
                    title="Thông báo"
                  >
                    <span className="material-symbols-outlined">notifications</span>
                    {notifications.some(n => !n.isRead) && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-white"></span>
                    )}
                  </button>

                  {showNotificationDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-[9999] overflow-hidden flex flex-col max-h-[400px]">
                      <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-primary">notifications</span>
                          Thông báo mới
                        </span>
                        <button 
                          onClick={async () => {
                            try {
                              await api.put('/notifications/read-all');
                              setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="text-[10px] font-extrabold text-teal-600 hover:text-teal-700 transition-colors uppercase tracking-wide"
                        >
                          Đánh dấu đã đọc
                        </button>
                      </div>

                      <div className="flex-grow overflow-y-auto divide-y divide-slate-100 min-h-[120px] max-h-[280px]">
                        {loadingNotifications ? (
                          <div className="p-6 text-center text-slate-400">
                            <span className="material-symbols-outlined animate-spin text-xl text-slate-350">autorenew</span>
                            <p className="text-[10px] mt-1">Đang tải thông báo...</p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 space-y-1">
                            <span className="material-symbols-outlined text-2xl text-slate-300">notifications_off</span>
                            <p className="text-[10px] font-semibold text-slate-500">Chưa có thông báo nào</p>
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((notif) => (
                            <div 
                              key={notif._id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-3 flex flex-col gap-1 cursor-pointer transition-colors relative ${notif.isRead ? 'bg-white hover:bg-slate-50' : 'bg-primary/5 hover:bg-primary/10'}`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-xs text-slate-800">{notif.title}</span>
                                {!notif.isRead && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1"></span>}
                              </div>
                              <span className="text-[11px] text-slate-600">{notif.message}</span>
                              <span className="text-[9px] text-slate-400 mt-0.5">
                                {new Date(notif.createdAt).toLocaleString('vi-VN')}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Messenger-style Chats Dropdown */}
                <div className="relative flex items-center" ref={chatDropdownRef}>
                  <button 
                    onClick={() => {
                      if (!showChatDropdown) {
                        fetchConversationsDropdown();
                      }
                      setShowChatDropdown(!showChatDropdown);
                      setShowNotificationDropdown(false);
                    }}
                    className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-low flex items-center justify-center relative cursor-pointer"
                    title="Hộp thư"
                  >
                    <span className="material-symbols-outlined">chat</span>
                    {conversations.some(c => c.unreadCount > 0) && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-white"></span>
                    )}
                  </button>

                  {showChatDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-[9999] overflow-hidden flex flex-col max-h-[400px]">
                      {/* Dropdown Header */}
                      <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-primary">chat_bubble</span>
                          Tin nhắn gần đây
                        </span>
                        <Link 
                          to="/chat" 
                          onClick={() => setShowChatDropdown(false)}
                          className="text-[10px] font-extrabold text-teal-600 hover:text-teal-700 transition-colors uppercase tracking-wide"
                        >
                          Xem tất cả
                        </Link>
                      </div>

                      {/* Dropdown Conversations List */}
                      <div className="flex-grow overflow-y-auto divide-y divide-slate-100 min-h-[120px] max-h-[280px]">
                        {loadingConversations ? (
                          <div className="p-6 text-center text-slate-400">
                            <span className="material-symbols-outlined animate-spin text-xl text-slate-350">autorenew</span>
                            <p className="text-[10px] mt-1">Đang tải tin nhắn...</p>
                          </div>
                        ) : conversations.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 space-y-1">
                            <span className="material-symbols-outlined text-2xl text-slate-300">forum</span>
                            <p className="text-[10px] font-semibold text-slate-500">Chưa có tin nhắn nào</p>
                          </div>
                        ) : (
                          conversations.slice(0, 5).map((conv) => {
                            const initials = conv.user.name ? conv.user.name.charAt(0).toUpperCase() : 'U';
                            const roleBadgeColor = conv.user.role === 'lender' ? 'bg-secondary/10 text-secondary border-secondary/20' : 'bg-primary/10 text-primary border-primary/20';
                            return (
                              <div 
                                key={conv.user._id}
                                onClick={() => {
                                  window.dispatchEvent(new CustomEvent('open-chat', {
                                    detail: {
                                      userId: conv.user._id,
                                      name: conv.user.name,
                                      role: conv.user.role
                                    }
                                  }));
                                  setShowChatDropdown(false);
                                }}
                                className="p-3 flex items-start gap-2.5 cursor-pointer hover:bg-slate-50 transition-colors relative"
                              >
                                {conv.user.avatar ? (
                                  <img src={conv.user.avatar} alt="User Avatar" className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs flex-shrink-0">
                                    {initials}
                                  </div>
                                )}
                                <div className="flex-grow min-w-0">
                                  <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <span className="font-bold text-xs text-slate-800 truncate">{conv.user.name}</span>
                                    <span className={`text-[8px] font-bold px-1 py-0.2 rounded border ${roleBadgeColor} uppercase tracking-wider scale-90`}>
                                      {conv.user.role === 'lender' ? 'Lender' : 'Renter'}
                                    </span>
                                  </div>
                                  <p className={`text-[11px] truncate ${conv.unreadCount > 0 ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                                    {conv.lastMessage?.content || ''}
                                  </p>
                                </div>
                                {conv.unreadCount > 0 && (
                                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 self-center"></span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Dropdown Footer */}
                      <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                        <Link 
                          to="/chat" 
                          onClick={() => setShowChatDropdown(false)}
                          className="block text-xs font-bold text-slate-700 hover:text-teal-600 py-1 transition-colors"
                        >
                          Xem tất cả trong Hộp thư
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <Link to="/profile" className="text-on-surface-variant hover:text-primary transition-colors p-0.5 rounded-full hover:bg-surface-container-low flex items-center justify-center">
                  {storedUser?.avatar ? (
                    <img src={storedUser.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <span className="material-symbols-outlined p-1.5">person</span>
                  )}
                </Link>

                {storedUser?.lenderStatus === 'approved' && (
                  <button 
                    onClick={handleSwitchRole}
                    className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-low flex items-center justify-center"
                    title={role === 'lender' ? 'Chuyển sang Renter' : 'Chuyển sang Lender'}
                  >
                    <span className="material-symbols-outlined">swap_horiz</span>
                  </button>
                )}
                <button 
                  onClick={handleLogout} 
                  className="font-title-md text-[16px] font-semibold text-error hover:text-red-700 transition-colors px-4 py-2"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="hidden md:block font-title-md text-[16px] font-semibold text-secondary hover:text-secondary-container transition-colors px-4 py-2">
                  Đăng nhập
                </Link>
                <Link to="/register" className="bg-primary-container text-on-primary hover:bg-primary transition-colors font-title-md text-[16px] font-semibold px-6 py-2.5 rounded-lg shadow-sm active:scale-95">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="bg-surface fixed bottom-0 w-full z-50 md:hidden border-t border-outline-variant/20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
        <div className="flex justify-around items-center w-full px-4 py-2">
          <Link to="/" className="flex flex-col items-center justify-center text-primary bg-primary-container/10 rounded-xl p-2 w-[64px]">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
            <span className="font-label-sm mt-1">Khám phá</span>
          </Link>
          <Link to="/assets" className="flex flex-col items-center justify-center text-on-surface-variant p-2 w-[64px] hover:bg-surface-container-highest rounded-xl transition-colors">
            <span className="material-symbols-outlined">search</span>
            <span className="font-label-sm mt-1">Tìm kiếm</span>
          </Link>
          <Link to="/orders" className="flex flex-col items-center justify-center text-on-surface-variant p-2 w-[64px] hover:bg-surface-container-highest rounded-xl transition-colors">
            <span className="material-symbols-outlined">calendar_today</span>
            <span className="font-label-sm mt-1">Thuê đồ</span>
          </Link>
          <Link to="/chat" className="flex flex-col items-center justify-center text-on-surface-variant p-2 w-[64px] hover:bg-surface-container-highest rounded-xl transition-colors">
            <span className="material-symbols-outlined">chat</span>
            <span className="font-label-sm mt-1">Tin nhắn</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center justify-center text-on-surface-variant p-2 w-[64px] hover:bg-surface-container-highest rounded-xl transition-colors">
            <span className="material-symbols-outlined">person</span>
            <span className="font-label-sm mt-1">Cá nhân</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-[72px] pb-[80px] md:pb-0">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest dark:bg-inverse-surface w-full mt-auto border-t border-outline-variant/50 pb-20 md:pb-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter px-margin-desktop py-12 max-w-container-max mx-auto">
          <div className="col-span-2 md:col-span-1 flex flex-col mb-8 md:mb-0">
            <Link to="/" className="font-display-lg text-headline-lg text-primary dark:text-primary-fixed mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
              EquipPeer
            </Link>
            <p className="text-on-surface-variant font-body-md mb-6 pr-4">Nền tảng chia sẻ thiết bị công nghệ và dã ngoại hàng đầu. Kết nối đam mê, tối ưu chi phí.</p>
            <div className="flex gap-4">
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">share</span></a>
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">language</span></a>
            </div>
          </div>
          <div>
            <h4 className="font-title-md text-[18px] text-on-surface font-semibold mb-6">Khám phá</h4>
            <ul className="space-y-4 flex flex-col">
              <li><Link className="font-body-md text-body-md text-on-surface-variant dark:text-surface-variant hover:text-secondary hover:underline decoration-secondary transition-all" to="/assets?category=tech">Đồ công nghệ</Link></li>
              <li><Link className="font-body-md text-body-md text-on-surface-variant dark:text-surface-variant hover:text-secondary hover:underline decoration-secondary transition-all" to="/assets?category=camping">Đồ dùng cắm trại</Link></li>
              <li><Link className="font-body-md text-body-md text-on-surface-variant dark:text-surface-variant hover:text-secondary hover:underline decoration-secondary transition-all" to="/blogs">Quy trình hoạt động</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-title-md text-[18px] text-on-surface font-semibold mb-6">Hỗ trợ</h4>
            <ul className="space-y-4 flex flex-col">
              <li><a className="font-body-md text-body-md text-on-surface-variant dark:text-surface-variant hover:text-secondary hover:underline decoration-secondary transition-all" href="#">Trung tâm trợ giúp</a></li>
              <li><a className="font-body-md text-body-md text-on-surface-variant dark:text-surface-variant hover:text-secondary hover:underline decoration-secondary transition-all" href="#">Tin cậy & An toàn</a></li>
              <li><a className="font-body-md text-body-md text-on-surface-variant dark:text-surface-variant hover:text-secondary hover:underline decoration-secondary transition-all" href="#">Liên hệ</a></li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1 mt-8 md:mt-0">
            <h4 className="font-title-md text-[18px] text-on-surface font-semibold mb-6">Pháp lý</h4>
            <ul className="space-y-4 flex flex-col">
              <li><a className="font-body-md text-body-md text-on-surface-variant dark:text-surface-variant hover:text-secondary hover:underline decoration-secondary transition-all" href="#">Điều khoản dịch vụ</a></li>
              <li><a className="font-body-md text-body-md text-on-surface-variant dark:text-surface-variant hover:text-secondary hover:underline decoration-secondary transition-all" href="#">Chính sách bảo mật</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-outline-variant/20 px-margin-desktop py-6 text-center">
          <p className="font-body-md text-body-md text-on-surface-variant">© 2024 EquipPeer. Sẵn sàng hành trình, an tâm chia sẻ.</p>
        </div>
      </footer>
      <AIChatbot />
      <FloatingChat />
    </div>
  );
};

export default HomeTemplate;
