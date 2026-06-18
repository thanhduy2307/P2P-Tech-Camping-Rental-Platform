import React, { useState, useEffect } from 'react';
import api from '../../configs/axios';

const DashboardAdmin = () => {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Data States
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [lenderApps, setLenderApps] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [assets, setAssets] = useState([]);
  const [orders, setOrders] = useState([]);

  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [assetStatusFilter, setAssetStatusFilter] = useState('all');
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Modal / Interaction States
  const [rejectionModal, setRejectionModal] = useState({ open: false, type: null, id: null });
  const [rejectReason, setRejectReason] = useState('');
  const [lightbox, setLightbox] = useState({ open: false, imgUrl: '', title: '' });

  // Notification helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // Format Helpers
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // API Call Handlers
  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data && res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể tải số liệu thống kê.', 'error');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (userRoleFilter !== 'all') params.role = userRoleFilter;
      if (userSearch.trim()) params.search = userSearch.trim();

      const res = await api.get('/admin/users', { params });
      if (res.data && res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể tải danh sách thành viên.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLenderApps = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/lender-applications');
      if (res.data && res.data.success) {
        setLenderApps(res.data.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể tải đơn đăng ký Lender.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/withdrawals');
      if (res.data && res.data.success) {
        setWithdrawals(res.data.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể tải danh sách rút tiền.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (assetStatusFilter !== 'all') params.status = assetStatusFilter;
      
      const res = await api.get('/admin/assets', { params });
      if (res.data && res.data.success) {
        setAssets(res.data.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể tải danh sách thiết bị.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (orderStatusFilter !== 'all') params.status = orderStatusFilter;

      const res = await api.get('/admin/orders', { params });
      if (res.data && res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể tải danh sách đơn hàng.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch relevant tab data
  useEffect(() => {
    fetchStats(); // Stats are useful for badges across tabs
    
    switch (activeTab) {
      case 'stats':
        fetchStats();
        break;
      case 'users':
        fetchUsers();
        break;
      case 'lenders':
        fetchLenderApps();
        break;
      case 'withdrawals':
        fetchWithdrawals();
        break;
      case 'assets':
        fetchAssets();
        break;
      case 'orders':
        fetchOrders();
        break;
      default:
        break;
    }
  }, [activeTab, userRoleFilter, assetStatusFilter, orderStatusFilter]);

  // Handle User search triggers (debounced search would be nice, but simple button/submit or trigger on enter)
  const handleUserSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  // Ban/Unban Handler
  const handleToggleBan = async (userItem) => {
    const confirmMsg = userItem.isBanned 
      ? `Bạn có chắc chắn muốn MỞ KHÓA tài khoản của ${userItem.name}?` 
      : `Bạn có chắc chắn muốn KHÓA (BAN) tài khoản của ${userItem.name}?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.put(`/admin/users/${userItem._id}/ban`);
      if (res.data && res.data.success) {
        showToast(res.data.message || 'Cập nhật trạng thái khóa thành công.');
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể thực hiện tác vụ.', 'error');
    }
  };

  // Role modification dropdown change handler
  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data && res.data.success) {
        showToast('Thay đổi vai trò người dùng thành công.');
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể đổi vai trò.', 'error');
    }
  };

  // eKYC App verification approvals
  const handleVerifyLender = async (id, status) => {
    if (status === 'approved') {
      if (!window.confirm('Xác nhận phê duyệt hồ sơ eKYC này và cấp quyền Lender?')) return;
      try {
        const res = await api.put(`/auth/lender-applications/${id}/verify`, { status });
        if (res.data && res.data.success) {
          showToast('Phê duyệt hồ sơ Lender thành công.');
          fetchLenderApps();
          fetchStats();
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'Thao tác thất bại.', 'error');
      }
    } else {
      // open rejection modal
      setRejectionModal({ open: true, type: 'lender', id });
      setRejectReason('');
    }
  };

  // Withdrawal verification approvals
  const handleVerifyWithdrawal = async (id, status) => {
    if (status === 'approved') {
      if (!window.confirm('Xác nhận duyệt yêu cầu rút tiền này? Số dư ví người dùng đã được trừ.')) return;
      try {
        const res = await api.put(`/auth/withdrawals/${id}/verify`, { status });
        if (res.data && res.data.success) {
          showToast('Duyệt yêu cầu rút tiền thành công.');
          fetchWithdrawals();
          fetchStats();
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'Thao tác thất bại.', 'error');
      }
    } else {
      // open rejection modal
      setRejectionModal({ open: true, type: 'withdrawal', id });
      setRejectReason('');
    }
  };

  // Rejection Submission
  const submitRejection = async () => {
    if (!rejectReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối.', 'error');
      return;
    }

    try {
      if (rejectionModal.type === 'lender') {
        const res = await api.put(`/auth/lender-applications/${rejectionModal.id}/verify`, {
          status: 'rejected',
          rejectReason: rejectReason.trim()
        });
        if (res.data && res.data.success) {
          showToast('Đã từ chối hồ sơ đăng ký Lender.');
          fetchLenderApps();
          fetchStats();
        }
      } else if (rejectionModal.type === 'withdrawal') {
        const res = await api.put(`/auth/withdrawals/${rejectionModal.id}/verify`, {
          status: 'rejected',
          rejectReason: rejectReason.trim()
        });
        if (res.data && res.data.success) {
          showToast('Đã từ chối yêu cầu rút tiền và hoàn trả số dư ví.');
          fetchWithdrawals();
          fetchStats();
        }
      }
      setRejectionModal({ open: false, type: null, id: null });
      setRejectReason('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Thao tác từ chối thất bại.', 'error');
    }
  };

  // Image zoom handler
  const openImageLightbox = (imgUrl, title) => {
    setLightbox({ open: true, imgUrl, title });
  };

  // Dynamic status badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
      case 'approved':
      case 'completed':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max"><span className="material-symbols-outlined text-[14px]">check_circle</span>Đã duyệt</span>;
      case 'pending':
      case 'pending_approval':
      case 'reserved':
      case 'active':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 flex items-center gap-1 w-max"><span className="material-symbols-outlined text-[14px]">schedule</span>Chờ duyệt / Đang chạy</span>;
      case 'rejected':
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 flex items-center gap-1 w-max"><span className="material-symbols-outlined text-[14px]">cancel</span>Bị từ chối</span>;
      case 'disputed':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-850 flex items-center gap-1 w-max"><span className="material-symbols-outlined text-[14px]">warning</span>Tranh chấp</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 w-max">{status}</span>;
    }
  };

  // Rendering Functions for Sub-Components/Tabs
  const renderStatsTab = () => {
    if (!stats) return <div className="text-center text-slate-500 py-12">Đang tải số liệu thống kê...</div>;

    const roleBreakdown = [
      { name: 'Khách thuê (Renter)', count: stats.users.renters, color: 'bg-blue-500' },
      { name: 'Chủ đồ (Lender)', count: stats.users.lenders, color: 'bg-emerald-500' },
      { name: 'Kiểm duyệt viên (Inspector)', count: stats.users.inspectors, color: 'bg-amber-500' },
      { name: 'Quản trị viên (Admin)', count: stats.users.admins, color: 'bg-purple-500' }
    ];

    const assetBreakdown = [
      { name: 'Đã kiểm duyệt (Verified)', count: stats.assets.verified, color: 'bg-emerald-500' },
      { name: 'Chờ kiểm duyệt (Pending)', count: stats.assets.pending, color: 'bg-amber-500' },
      { name: 'Bị từ chối (Rejected)', count: stats.assets.rejected, color: 'bg-rose-500' }
    ];

    const totalStatsItems = stats.users.total;
    const totalAssetItems = stats.assets.total;

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Users */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng Thành Viên</span>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.users.total}</h3>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <span className="font-medium text-emerald-600">+{stats.users.lenders}</span> chủ đồ (Lender) hoạt động
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <span className="material-symbols-outlined text-3xl">group</span>
            </div>
          </div>

          {/* Card 2: Assets */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng Số Thiết Bị</span>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.assets.total}</h3>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <span className="font-medium text-amber-500">{stats.assets.pending}</span> thiết bị đang chờ duyệt
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <span className="material-symbols-outlined text-3xl">category</span>
            </div>
          </div>

          {/* Card 3: Financials */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Doanh Thu Phí Nền Tảng</span>
              <h3 className="text-2xl font-bold text-slate-800 mt-1.5">{formatCurrency(stats.financials.totalPlatformFee)}</h3>
              <p className="text-xs text-slate-500 mt-2">
                Tổng GD: <span className="font-semibold">{formatCurrency(stats.financials.totalTransactionVolume)}</span>
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <span className="material-symbols-outlined text-3xl">payments</span>
            </div>
          </div>

          {/* Card 4: Action Items */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tác Vụ Cần Xử Lý</span>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">
                {(stats.pendingCounts?.withdrawals || 0) + (stats.pendingCounts?.lenderApplications || 0)}
              </h3>
              <p className="text-xs text-rose-500 mt-2 font-medium flex items-center gap-1">
                {stats.pendingCounts?.lenderApplications || 0} eKYC | {stats.pendingCounts?.withdrawals || 0} rút tiền
              </p>
            </div>
            <div className={`p-3 rounded-xl text-amber-600 ${((stats.pendingCounts?.withdrawals || 0) + (stats.pendingCounts?.lenderApplications || 0)) > 0 ? 'bg-rose-55 hover:bg-rose-100 animate-pulse' : 'bg-slate-50'}`}>
              <span className="material-symbols-outlined text-3xl">notifications_active</span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Breakdown Card */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
            <h4 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">pie_chart</span>
              Cơ cấu thành viên hệ thống
            </h4>
            <div className="space-y-4">
              {roleBreakdown.map((role, idx) => {
                const percentage = totalStatsItems > 0 ? Math.round((role.count / totalStatsItems) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 font-medium">{role.name}</span>
                      <span className="text-slate-900 font-bold">{role.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className={`${role.color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
              <span>Số dư tổng ví các thành viên:</span>
              <span className="font-bold text-slate-800">{formatCurrency(stats.financials.totalWalletBalance)}</span>
            </div>
          </div>

          {/* Asset Breakdown Card */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
            <h4 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">donut_large</span>
              Trạng thái kiểm duyệt thiết bị
            </h4>
            <div className="space-y-4">
              {assetBreakdown.map((asset, idx) => {
                const percentage = totalAssetItems > 0 ? Math.round((asset.count / totalAssetItems) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 font-medium">{asset.name}</span>
                      <span className="text-slate-900 font-bold">{asset.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className={`${asset.color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
              <span>Tổng đơn đặt thuê thiết bị:</span>
              <span className="font-bold text-slate-850">{stats.orders.total} đơn hàng</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800">
          <h4 className="font-bold text-lg mb-2 flex items-center gap-2 text-emerald-400">
            <span className="material-symbols-outlined">rocket_launch</span>
            Bảng điều khiển tác vụ nhanh Admin
          </h4>
          <p className="text-slate-400 text-sm mb-6">
            Duyệt eKYC và lệnh rút tiền đang xếp hàng để giữ cho dòng tiền của hệ thống và quyền lợi chủ đồ được hoạt động liền mạch.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab('lenders')}
              className="flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-750 transition-colors border border-slate-700 rounded-lg group text-left"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-400 text-2xl group-hover:scale-110 transition-transform">assignment_ind</span>
                <div>
                  <h5 className="font-semibold text-slate-200">Duyệt hồ sơ eKYC Lender</h5>
                  <p className="text-xs text-slate-400 mt-0.5">Yêu cầu từ Renter đăng ký nâng cấp lên Lender</p>
                </div>
              </div>
              {stats.pendingCounts?.lenderApplications > 0 && (
                <span className="px-2.5 py-0.5 bg-rose-500 text-white font-bold text-xs rounded-full">
                  {stats.pendingCounts.lenderApplications} mới
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('withdrawals')}
              className="flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-750 transition-colors border border-slate-700 rounded-lg group text-left"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-400 text-2xl group-hover:scale-110 transition-transform">account_balance_wallet</span>
                <div>
                  <h5 className="font-semibold text-slate-200">Phê duyệt lệnh rút tiền</h5>
                  <p className="text-xs text-slate-400 mt-0.5">Yêu cầu rút ví khả dụng của các thành viên</p>
                </div>
              </div>
              {stats.pendingCounts?.withdrawals > 0 && (
                <span className="px-2.5 py-0.5 bg-rose-500 text-white font-bold text-xs rounded-full">
                  {stats.pendingCounts.withdrawals} mới
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderUsersTab = () => {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <form onSubmit={handleUserSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder="Tìm kiếm người dùng theo tên, email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm text-slate-800"
              />
              {userSearch && (
                <button
                  type="button"
                  onClick={() => { setUserSearch(''); setTimeout(() => fetchUsers(), 0); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div className="w-full md:w-48">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm text-slate-700 bg-white"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="renter">Renter (Khách thuê)</option>
                <option value="lender">Lender (Chủ đồ)</option>
                <option value="inspector">Inspector (Kiểm duyệt)</option>
                <option value="admin">Quản trị viên (Admin)</option>
              </select>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2.5 bg-emerald-600 text-white font-medium text-sm rounded-lg hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-20 text-slate-500">Đang tải danh sách thành viên...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-slate-500">Không tìm thấy người dùng phù hợp.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Thành Viên</th>
                    <th className="px-6 py-4">Liên Hệ / ĐT</th>
                    <th className="px-6 py-4">Vai Trò (Role)</th>
                    <th className="px-6 py-4">Trạng Thái eKYC</th>
                    <th className="px-6 py-4">Ví Khả Dụng</th>
                    <th className="px-6 py-4">Ngày Tham Gia</th>
                    <th className="px-6 py-4 text-right">Tác Vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {users.map((userItem) => (
                    <tr key={userItem._id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name & Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-base shadow-sm">
                            {userItem.name ? userItem.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {userItem.name}
                              {userItem.role === 'admin' && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 rounded">Admin</span>
                              )}
                              {userItem.isBanned && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded">Bị khóa</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">{userItem.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Address */}
                      <td className="px-6 py-4">
                        <div className="text-slate-800">{userItem.phoneNumber || 'Chưa cập nhật'}</div>
                        <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">
                          {userItem.address ? `${userItem.address.street}, ${userItem.address.ward}` : 'Chưa có địa chỉ'}
                        </div>
                      </td>

                      {/* Role selection dropdown */}
                      <td className="px-6 py-4">
                        <select
                          value={userItem.role}
                          onChange={(e) => handleRoleChange(userItem._id, e.target.value)}
                          className="px-2.5 py-1 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-slate-700 bg-white"
                          disabled={userItem.role === 'admin' && userItem.email === 'admin@example.com'} // Avoid demoting master admin
                        >
                          <option value="renter">Renter</option>
                          <option value="lender">Lender</option>
                          <option value="inspector">Inspector</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      {/* eKYC Status */}
                      <td className="px-6 py-4">
                        {userItem.lenderStatus === 'approved' && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800">Approved</span>
                        )}
                        {userItem.lenderStatus === 'pending' && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800">Pending</span>
                        )}
                        {userItem.lenderStatus === 'rejected' && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-100 text-rose-800">Rejected</span>
                        )}
                        {(!userItem.lenderStatus || userItem.lenderStatus === 'none') && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-600">None</span>
                        )}
                      </td>

                      {/* Balance */}
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {formatCurrency(userItem.balance)}
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {formatDate(userItem.createdAt)}
                      </td>

                      {/* Ban toggle action */}
                      <td className="px-6 py-4 text-right">
                        {userItem.role !== 'admin' ? (
                          <button
                            onClick={() => handleToggleBan(userItem)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1 ml-auto cursor-pointer transition-colors ${
                              userItem.isBanned 
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' 
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {userItem.isBanned ? 'lock_open' : 'block'}
                            </span>
                            {userItem.isBanned ? 'Mở khóa' : 'Khóa'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Admin Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLendersTab = () => {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-sm text-amber-850">
          <span className="material-symbols-outlined text-amber-600 text-xl shrink-0">info</span>
          <div>
            <span className="font-semibold">Lưu ý phê duyệt eKYC:</span> Cần đối chiếu ảnh chụp CCCD mặt trước, mặt sau và ảnh selfie chân dung để xác thực chính xác danh tính của Renter trước khi phê duyệt nâng cấp vai trò. Hồ sơ bị từ chối bắt buộc phải nhập lý do giải trình.
          </div>
        </div>

        {loading ? (
          <div className="bg-white border rounded-xl p-16 text-center text-slate-500 shadow-sm">Đang tải hồ sơ eKYC...</div>
        ) : lenderApps.length === 0 ? (
          <div className="bg-white border rounded-xl p-16 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-5xl text-emerald-500 bg-emerald-50 p-3 rounded-full">verified</span>
            <div className="font-bold text-slate-800 text-lg">Không có hồ sơ chờ duyệt</div>
            <div className="text-sm text-slate-400 max-w-sm">Tất cả các đơn đăng ký trở thành Người cho thuê đã được xử lý thành công.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {lenderApps.map((app) => (
              <div key={app._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
                {/* Header Information */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                      {app.name}
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded">Chờ duyệt eKYC</span>
                    </h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">mail</span>{app.email}</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">call</span>{app.phoneNumber || 'Chưa cập nhật'}</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">calendar_today</span>Nộp lúc: {formatDate(app.lenderOnboarding?.createdAt || app.updatedAt)}</span>
                    </div>
                    {app.address && (
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <span className="material-symbols-outlined text-[15px]">location_on</span>
                        Địa chỉ: {app.address.street}, {app.address.ward}, {app.address.district}, {app.address.province}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerifyLender(app._id, 'approved')}
                      className="px-4 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Phê Duyệt
                    </button>
                    <button
                      onClick={() => handleVerifyLender(app._id, 'rejected')}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-250 font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      Từ Chối
                    </button>
                  </div>
                </div>

                {/* Bank details submitted */}
                {app.lenderOnboarding?.bankAccount && (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/60 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-slate-400 block uppercase font-semibold">Tên Ngân Hàng</span>
                      <span className="font-semibold text-slate-800">{app.lenderOnboarding.bankAccount.bankName}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block uppercase font-semibold">Số Tài Khoản (STK)</span>
                      <span className="font-bold text-emerald-800 tracking-wide">{app.lenderOnboarding.bankAccount.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block uppercase font-semibold">Chủ Tài Khoản</span>
                      <span className="font-bold text-slate-800 uppercase">{app.lenderOnboarding.bankAccount.accountHolder}</span>
                    </div>
                  </div>
                )}

                {/* Documents Photos Display with Lightbox Zoom option */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* CCCD Front */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500 block">Ảnh CCCD Mặt Trước</span>
                    <div 
                      onClick={() => openImageLightbox(app.lenderOnboarding?.cccdFront, `CCCD Mặt Trước - ${app.name}`)}
                      className="aspect-[8/5] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-90 relative group transition-opacity"
                    >
                      <img 
                        src={app.lenderOnboarding?.cccdFront || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80'} 
                        alt="Mặt trước CCCD" 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                        <span className="material-symbols-outlined text-lg">zoom_in</span> Click để phóng to
                      </div>
                    </div>
                  </div>

                  {/* CCCD Back */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500 block">Ảnh CCCD Mặt Sau</span>
                    <div 
                      onClick={() => openImageLightbox(app.lenderOnboarding?.cccdBack, `CCCD Mặt Sau - ${app.name}`)}
                      className="aspect-[8/5] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-90 relative group transition-opacity"
                    >
                      <img 
                        src={app.lenderOnboarding?.cccdBack || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80'} 
                        alt="Mặt sau CCCD" 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                        <span className="material-symbols-outlined text-lg">zoom_in</span> Click để phóng to
                      </div>
                    </div>
                  </div>

                  {/* Selfie */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500 block">Ảnh Selfie Chân Dung</span>
                    <div 
                      onClick={() => openImageLightbox(app.lenderOnboarding?.cccdSelfie, `Selfie Chân Dung - ${app.name}`)}
                      className="aspect-[8/5] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-90 relative group transition-opacity"
                    >
                      <img 
                        src={app.lenderOnboarding?.cccdSelfie || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80'} 
                        alt="Ảnh Selfie" 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                        <span className="material-symbols-outlined text-lg">zoom_in</span> Click để phóng to
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderWithdrawalsTab = () => {
    const filteredWithdrawals = withdrawals.filter(w => {
      if (withdrawalStatusFilter === 'all') return true;
      return w.status === withdrawalStatusFilter;
    });

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Status Filter */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex flex-wrap gap-2 items-center">
          <span className="text-sm font-semibold text-slate-500 mr-2">Trạng thái yêu cầu:</span>
          {['all', 'pending', 'approved', 'rejected'].map((statusOption) => (
            <button
              key={statusOption}
              onClick={() => setWithdrawalStatusFilter(statusOption)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                withdrawalStatusFilter === statusOption
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
              }`}
            >
              {statusOption === 'all' && 'Tất cả'}
              {statusOption === 'pending' && `Chờ duyệt (${withdrawals.filter(w => w.status === 'pending').length})`}
              {statusOption === 'approved' && 'Đã chuyển khoản'}
              {statusOption === 'rejected' && 'Đã từ chối'}
            </button>
          ))}
        </div>

        {/* Withdrawal requests table */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-20 text-slate-500">Đang tải danh sách yêu cầu rút tiền...</div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="text-center py-20 text-slate-500">Không tìm thấy yêu cầu rút tiền phù hợp.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Thành Viên Rút Tiền</th>
                    <th className="px-6 py-4">Số Tiền Rút</th>
                    <th className="px-6 py-4">Thông Tin Tài Khoản Nhận</th>
                    <th className="px-6 py-4">Trạng Thái</th>
                    <th className="px-6 py-4">Ngày Yêu Cầu</th>
                    <th className="px-6 py-4 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredWithdrawals.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Lender Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center font-bold text-base shadow-sm">
                            {req.lender?.name ? req.lender.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{req.lender?.name || 'Thành viên'}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{req.lender?.email}</div>
                            {req.lender?.phoneNumber && (
                              <div className="text-xs text-slate-400">{req.lender.phoneNumber}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <div className="text-base font-bold text-slate-900">{formatCurrency(req.amount)}</div>
                      </td>

                      {/* Bank account details */}
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-800">
                          NH: <span className="font-semibold">{req.bankAccount?.bankName}</span>
                        </div>
                        <div className="text-xs text-slate-850 font-bold tracking-wide mt-0.5">
                          STK: {req.bankAccount?.accountNumber}
                        </div>
                        <div className="text-xs text-slate-450 uppercase mt-0.5">
                          Chủ TK: {req.bankAccount?.accountHolder}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {getStatusBadge(req.status)}
                        {req.status === 'rejected' && req.rejectReason && (
                          <div className="text-xs text-rose-600 mt-1 max-w-[200px] break-words italic">
                            Lý do: "{req.rejectReason}"
                          </div>
                        )}
                      </td>

                      {/* Request Date */}
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {formatDate(req.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        {req.status === 'pending' ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleVerifyWithdrawal(req._id, 'approved')}
                              className="px-2.5 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-0.5"
                            >
                              <span className="material-symbols-outlined text-[15px]">check_circle</span> Duyệt
                            </button>
                            <button
                              onClick={() => handleVerifyWithdrawal(req._id, 'rejected')}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs rounded transition-colors cursor-pointer flex items-center gap-0.5"
                            >
                              <span className="material-symbols-outlined text-[15px]">cancel</span> Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Đã xử lý</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAssetsTab = () => {
    const filteredAssets = assets.filter(a => {
      if (assetStatusFilter === 'all') return true;
      return a.status === assetStatusFilter;
    });

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Filter Toolbar */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex flex-wrap gap-2 items-center">
          <span className="text-sm font-semibold text-slate-500 mr-2">Lọc trạng thái:</span>
          {['all', 'verified', 'pending_approval', 'rejected'].map((statusOption) => (
            <button
              key={statusOption}
              onClick={() => setAssetStatusFilter(statusOption)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                assetStatusFilter === statusOption
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
              }`}
            >
              {statusOption === 'all' && 'Tất cả thiết bị'}
              {statusOption === 'verified' && 'Đã duyệt (Verified)'}
              {statusOption === 'pending_approval' && `Chờ duyệt (${assets.filter(a => a.status === 'pending_approval').length})`}
              {statusOption === 'rejected' && 'Bị từ chối'}
            </button>
          ))}
        </div>

        {/* Assets List */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-20 text-slate-500">Đang tải danh sách thiết bị...</div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-20 text-slate-500">Không tìm thấy thiết bị phù hợp.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Thiết Bị</th>
                    <th className="px-6 py-4">Chủ Sở Hữu (Lender)</th>
                    <th className="px-6 py-4">Giá Thuê / Ngày</th>
                    <th className="px-6 py-4">Trạng Thái</th>
                    <th className="px-6 py-4">Ngày Tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredAssets.map((assetItem) => (
                    <tr key={assetItem._id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Asset item */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                            <img
                              src={(assetItem.images && assetItem.images[0]) || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80'}
                              alt={assetItem.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{assetItem.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">Độ mới: {assetItem.condition || '95%'} | Hãng: {assetItem.brand || 'Khác'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Owner details */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{assetItem.lender?.name || 'Chủ đồ'}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{assetItem.lender?.email || 'N/A'}</div>
                      </td>

                      {/* Price per Day */}
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {formatCurrency(assetItem.pricePerDay)}
                      </td>

                      {/* Status badge */}
                      <td className="px-6 py-4">
                        {getStatusBadge(assetItem.status)}
                      </td>

                      {/* Created date */}
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {formatDate(assetItem.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOrdersTab = () => {
    const filteredOrders = orders.filter(o => {
      if (orderStatusFilter === 'all') return true;
      return o.status === orderStatusFilter;
    });

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Filters Toolbar */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex flex-wrap gap-2 items-center">
          <span className="text-sm font-semibold text-slate-500 mr-2">Lọc trạng thái đơn:</span>
          {['all', 'reserved', 'active', 'completed', 'disputed', 'cancelled'].map((statusOption) => (
            <button
              key={statusOption}
              onClick={() => setOrderStatusFilter(statusOption)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                orderStatusFilter === statusOption
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
              }`}
            >
              {statusOption === 'all' && 'Tất cả'}
              {statusOption === 'reserved' && 'Reserved (Chờ nhận đồ)'}
              {statusOption === 'active' && 'Active (Đang thuê)'}
              {statusOption === 'completed' && 'Completed (Đã trả đồ)'}
              {statusOption === 'disputed' && `Disputed (${orders.filter(o => o.status === 'disputed').length})`}
              {statusOption === 'cancelled' && 'Cancelled (Đã hủy)'}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-20 text-slate-500">Đang tải danh sách đơn hàng...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20 text-slate-500">Không tìm thấy đơn hàng phù hợp.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Đơn Hàng / Thiết Bị</th>
                    <th className="px-6 py-4">Khách Thuê (Renter)</th>
                    <th className="px-6 py-4">Thời Gian Thuê</th>
                    <th className="px-6 py-4">Thanh Toán</th>
                    <th className="px-6 py-4">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Asset Info & ID */}
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-bold text-emerald-800 text-xs font-mono block">#{order._id.substring(order._id.length - 8)}</span>
                          <span className="font-semibold text-slate-900 mt-1 block">{order.asset?.name || 'Thiết bị'}</span>
                          <span className="text-xs text-slate-400 block mt-0.5">Giá: {formatCurrency(order.asset?.pricePerDay)}/ngày</span>
                        </div>
                      </td>

                      {/* Renter details */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{order.renter?.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{order.renter?.email}</div>
                      </td>

                      {/* Rental dates */}
                      <td className="px-6 py-4 text-xs">
                        <div className="text-slate-800 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-emerald-600">login</span>
                          Từ: {formatDate(order.startDate).split(' ')[0]}
                        </div>
                        <div className="text-slate-850 flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-[14px] text-rose-600">logout</span>
                          Đến: {formatDate(order.endDate).split(' ')[0]}
                        </div>
                      </td>

                      {/* Pricing breakdowns */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{formatCurrency(order.totalRent + order.deposit)}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Thuê: {formatCurrency(order.totalRent)} | Cọc: {formatCurrency(order.deposit)}
                        </div>
                        {order.platformFee > 0 && (
                          <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded w-max mt-1">
                            Phí HT: {formatCurrency(order.platformFee)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm transition-all duration-300 animate-in slide-in-from-top-4 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span className="material-symbols-outlined text-lg">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{toast.message}</span>
          <button onClick={() => setToast({ ...toast, show: false })} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Lightbox Modal for CCCD Image zooming */}
      {lightbox.open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setLightbox({ open: false, imgUrl: '', title: '' })}>
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-lg overflow-hidden border border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-850 text-white">
              <h3 className="font-semibold text-sm">{lightbox.title || 'Xem ảnh phóng to'}</h3>
              <button onClick={() => setLightbox({ open: false, imgUrl: '', title: '' })} className="text-slate-400 hover:text-white cursor-pointer flex items-center">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-slate-950">
              <img src={lightbox.imgUrl} alt={lightbox.title} className="max-w-full max-h-[70vh] object-contain rounded" />
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason input dialog */}
      {rejectionModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-rose-600 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <span className="material-symbols-outlined">gavel</span>
                Từ chối phê duyệt
              </h3>
              <button onClick={() => setRejectionModal({ open: false, type: null, id: null })} className="text-white hover:text-rose-200 cursor-pointer flex items-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nhập lý do chi tiết để thông báo cho người dùng (ví dụ: ảnh mờ, thông tin STK sai,...):
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows="4"
                className="w-full border border-slate-300 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm resize-none"
                placeholder="Nhập lý do tại đây..."
                required
              />
              <div className="mt-5 flex justify-end gap-2.5">
                <button
                  onClick={() => setRejectionModal({ open: false, type: null, id: null })}
                  className="px-4 py-2 border border-slate-250 text-slate-600 rounded-lg hover:bg-slate-55 text-xs font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={submitRejection}
                  disabled={!rejectReason.trim()}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Xác nhận Từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Title & Refresh */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-emerald-700">admin_panel_settings</span>
            Hệ Thống Quản Trị Admin
          </h2>
          <p className="text-sm text-slate-500 mt-1">Giám sát các chỉ số cốt lõi và kiểm duyệt các nghiệp vụ trong thời gian thực.</p>
        </div>

        <button
          onClick={() => {
            fetchStats();
            if (activeTab === 'users') fetchUsers();
            else if (activeTab === 'lenders') fetchLenderApps();
            else if (activeTab === 'withdrawals') fetchWithdrawals();
            else if (activeTab === 'assets') fetchAssets();
            else if (activeTab === 'orders') fetchOrders();
            showToast('Đã làm mới dữ liệu hệ thống.');
          }}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-650 hover:bg-slate-50 shadow-sm text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[17px]">sync</span>
          Làm mới dữ liệu
        </button>
      </div>

      {/* Tab Bars Navigation */}
      <div className="border-b border-slate-200">
        <div className="flex flex-wrap -mb-px gap-1">
          {/* Tab 1: Stats */}
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1.5 px-5 py-3 border-b-2 font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-450 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">query_stats</span>
            Tổng quan (Stats)
          </button>

          {/* Tab 2: Users */}
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-5 py-3 border-b-2 font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-450 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            Thành viên (Users)
          </button>

          {/* Tab 3: Lenders (eKYC Applications) */}
          <button
            onClick={() => setActiveTab('lenders')}
            className={`flex items-center gap-1.5 px-5 py-3 border-b-2 font-bold text-sm transition-all cursor-pointer relative ${
              activeTab === 'lenders'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-450 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">assignment_ind</span>
            Duyệt eKYC Lender
            {stats?.pendingCounts?.lenderApplications > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {stats.pendingCounts.lenderApplications}
              </span>
            )}
          </button>

          {/* Tab 4: Withdrawals */}
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex items-center gap-1.5 px-5 py-3 border-b-2 font-bold text-sm transition-all cursor-pointer relative ${
              activeTab === 'withdrawals'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-450 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            Duyệt rút tiền
            {stats?.pendingCounts?.withdrawals > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {stats.pendingCounts.withdrawals}
              </span>
            )}
          </button>

          {/* Tab 5: Assets */}
          <button
            onClick={() => setActiveTab('assets')}
            className={`flex items-center gap-1.5 px-5 py-3 border-b-2 font-bold text-sm transition-all cursor-pointer relative ${
              activeTab === 'assets'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-450 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">category</span>
            Quản lý thiết bị (Assets)
            {stats?.assets?.pending > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                {stats.assets.pending}
              </span>
            )}
          </button>

          {/* Tab 6: Orders */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 px-5 py-3 border-b-2 font-bold text-sm transition-all cursor-pointer relative ${
              activeTab === 'orders'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-450 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
            Đơn đặt thuê (Orders)
            {stats?.orders?.disputed > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
                {stats.orders.disputed}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area mapping to Active Tab */}
      <div className="min-h-[400px]">
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'lenders' && renderLendersTab()}
        {activeTab === 'withdrawals' && renderWithdrawalsTab()}
        {activeTab === 'assets' && renderAssetsTab()}
        {activeTab === 'orders' && renderOrdersTab()}
      </div>
    </div>
  );
};

export default DashboardAdmin;
