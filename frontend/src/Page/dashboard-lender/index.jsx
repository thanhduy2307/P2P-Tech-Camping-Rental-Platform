import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../configs/axios';

const DashboardLender = () => {
  const [balance, setBalance] = useState(0);
  const [assets, setAssets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Withdrawal modal state
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  // Withdrawal history state
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

  const fetchWithdrawals = async () => {
    setLoadingWithdrawals(true);
    try {
      const response = await api.get('/auth/my-withdrawals');
      if (response.data?.success) {
        setWithdrawals(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [balanceRes, assetsRes, ordersRes] = await Promise.all([
        api.get('/auth/balance'),
        api.get('/assets/my'),
        api.get('/orders/incoming')
      ]);

      if (balanceRes.data?.success) setBalance(balanceRes.data.data.balance || 0);
      if (assetsRes.data?.success) setAssets(assetsRes.data.data || []);
      if (ordersRes.data?.success) setOrders(ordersRes.data.data || []);
      
      // Prefill bank details from user data if available
      const userRes = await api.get('/auth/me');
      if (userRes.data?.success && userRes.data.data.lenderOnboarding?.bankAccount) {
        const bank = userRes.data.data.lenderOnboarding.bankAccount;
        setBankName(bank.bankName || '');
        setAccountNumber(bank.accountNumber || '');
        setAccountHolder(bank.accountHolder || '');
      }

      await fetchWithdrawals();
    } catch (err) {
      console.error("Failed to load lender dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess('');

    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setWithdrawError('Số tiền rút không hợp lệ.');
      return;
    }

    if (amount > balance) {
      setWithdrawError('Số dư ví không đủ.');
      return;
    }

    if (!bankName || !accountNumber || !accountHolder) {
      setWithdrawError('Vui lòng điền đầy đủ thông tin tài khoản ngân hàng.');
      return;
    }

    setWithdrawLoading(true);
    try {
      const response = await api.post('/auth/withdraw', {
        amount,
        bankAccount: { bankName, accountNumber, accountHolder }
      });

      if (response.data?.success) {
        setWithdrawSuccess('Yêu cầu rút tiền thành công! Số tiền đang được chờ Admin duyệt chuyển.');
        setBalance(prev => prev - amount);
        setWithdrawAmount('');
        fetchWithdrawals();
        // Refresh data after brief timeout
        setTimeout(() => {
          setWithdrawOpen(false);
          setWithdrawSuccess('');
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      setWithdrawError(err.response?.data?.message || 'Đã xảy ra lỗi khi tạo yêu cầu rút tiền.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Stats derivations
  const totalAssets = assets.length;
  const activeRentals = orders.filter(o => o.status === 'active').length;
  const pendingOrders = orders.filter(o => ['pending_payment', 'reserved'].includes(o.status)).length;
  
  // Recent incoming orders
  const recentOrders = orders.slice(0, 5);

  const formatCurrency = (val) => {
    return val.toLocaleString('vi-VN') + ' đ';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-slate-500 font-medium">Đang tải dữ liệu doanh thu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner (Stats Row) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-xl shadow-lg p-6 flex flex-col justify-between relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[100px]">account_balance_wallet</span>
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-teal-100">Số dư ví khả dụng</span>
            <h2 className="text-3xl font-extrabold mt-2 tracking-tight">{formatCurrency(balance)}</h2>
          </div>
          <button 
            onClick={() => setWithdrawOpen(true)}
            className="mt-6 w-full bg-white text-teal-700 font-bold text-sm py-2 px-4 rounded-lg shadow hover:bg-teal-50 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">payments</span>
            Rút tiền
          </button>
        </div>

        {/* Total Assets Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">widgets</span>
          </div>
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Thiết bị cho thuê</span>
            <span className="text-2xl font-bold text-slate-800">{totalAssets} món</span>
          </div>
        </div>

        {/* Pending Orders Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">pending_actions</span>
          </div>
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Yêu cầu mới</span>
            <span className="text-2xl font-bold text-slate-800">{pendingOrders} đơn</span>
          </div>
        </div>

        {/* Active Rentals Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-teal-50 text-teal-500 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">cached</span>
          </div>
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Đang được thuê</span>
            <span className="text-2xl font-bold text-slate-800">{activeRentals} đơn</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Orders & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
            <h3 className="font-bold text-slate-800">Đơn thuê mới gửi đến</h3>
            <Link to="/lender-orders" className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline">Xem tất cả</Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            {recentOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <span className="material-symbols-outlined text-4xl block mb-2">inbox</span>
                Hiện tại chưa có yêu cầu thuê thiết bị nào.
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 text-xs uppercase">
                    <th className="px-6 py-3">Thiết bị</th>
                    <th className="px-6 py-3">Người thuê</th>
                    <th className="px-6 py-3">Thời gian thuê</th>
                    <th className="px-6 py-3 text-right">Doanh thu</th>
                    <th className="px-6 py-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map(order => {
                    const priceFormatted = formatCurrency(order.totalRent);
                    const startStr = new Date(order.startDate).toLocaleDateString('vi-VN');
                    const endStr = new Date(order.endDate).toLocaleDateString('vi-VN');
                    
                    return (
                      <tr key={order._id} className="hover:bg-slate-55/20 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-700 truncate max-w-[150px]">{order.asset?.name || 'Deleted Asset'}</td>
                        <td className="px-6 py-4 text-slate-600">{order.renter?.name || 'Renter'}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {startStr} &rarr; {endStr}
                          <span className="block text-[10px] text-slate-400">({order.rentalDays} ngày)</span>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-emerald-600">{priceFormatted}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            order.status === 'reserved' ? 'bg-indigo-50 text-indigo-600' :
                            order.status === 'active' ? 'bg-teal-50 text-teal-600' :
                            order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                            order.status === 'pending_payment' ? 'bg-amber-50 text-amber-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Action Panel / Recent Assets */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Cài đặt thiết bị nhanh</h3>
            <div className="space-y-4">
              <Link 
                to="/post-asset"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-teal-50 text-teal-600 rounded-md flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined">add_circle</span>
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-slate-700 text-sm block">Đăng Thiết Bị Mới</span>
                    <span className="text-slate-400 text-xs">Cho thuê thiết bị công nghệ &amp; dã ngoại</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
              </Link>

              <Link 
                to="/lender-inventory"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined">inventory</span>
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-slate-700 text-sm block">Kho Thiết Bị Của Tôi</span>
                    <span className="text-slate-400 text-xs">Bật/tắt trạng thái, kiểm tra phê duyệt</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
              </Link>
            </div>
          </div>
          
          <div className="mt-8 bg-slate-50 border border-slate-100 rounded-lg p-4">
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">EquipPeer Bảo Hiểm</h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              Hãy an tâm, tất cả các giao dịch trên VeloX EquipPeer đều được đảm bảo ký quỹ cọc an toàn. Khi renter hoàn tất và bàn giao trả đồ, tiền sẽ được ghi nhận vào tài khoản của bạn.
            </p>
          </div>
        </div>
      </div>

      {/* Withdrawal History Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
          <span className="material-symbols-outlined text-teal-600">history</span>
          Lịch sử yêu cầu rút tiền
        </h3>
        {loadingWithdrawals ? (
          <p className="text-sm text-slate-500 italic">Đang tải lịch sử rút tiền...</p>
        ) : withdrawals.length === 0 ? (
          <p className="text-sm text-slate-500 italic">Bạn chưa thực hiện yêu cầu rút tiền nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 text-xs uppercase">
                  <th className="px-6 py-3">Ngày tạo</th>
                  <th className="px-6 py-3">Số tiền</th>
                  <th className="px-6 py-3">Tài khoản nhận</th>
                  <th className="px-6 py-3 text-center">Trạng thái</th>
                  <th className="px-6 py-3">Ghi chú từ Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {withdrawals.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(req.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatCurrency(req.amount)}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="font-semibold block text-slate-800">{req.bankAccount.bankName}</span>
                      <span className="text-slate-500">STK: {req.bankAccount.accountNumber}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {req.status === 'pending' && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-250">
                          Chờ duyệt
                        </span>
                      )}
                      {req.status === 'approved' && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-250">
                          Thành công
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-250">
                          Từ chối
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 italic max-w-xs truncate">
                      {req.status === 'rejected' && req.rejectReason ? req.rejectReason : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Dialog / Modal */}
      {withdrawOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden transform transition-all duration-300 scale-100">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined">account_balance</span>
                Yêu cầu rút tiền
              </h3>
              <button 
                onClick={() => setWithdrawOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleWithdrawSubmit} className="p-6 space-y-4">
              {withdrawError && (
                <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-xs font-semibold">
                  {withdrawError}
                </div>
              )}

              {withdrawSuccess && (
                <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg p-3 text-xs font-semibold">
                  {withdrawSuccess}
                </div>
              )}

              {/* Wallet Stats Summary */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Số dư hiện tại:</span>
                <span className="font-bold text-slate-800">{formatCurrency(balance)}</span>
              </div>

              {/* Amount Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase" htmlFor="w-amount">Số tiền rút (VNĐ)</label>
                <input 
                  id="w-amount"
                  type="number"
                  placeholder="e.g. 500000"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="10000"
                  required
                />
              </div>

              <hr className="border-slate-100 my-2" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tài khoản nhận tiền (Theo eKYC)</p>

              {/* Bank Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 uppercase" htmlFor="w-bank">Tên ngân hàng</label>
                <input 
                  id="w-bank"
                  type="text"
                  placeholder="e.g. Vietcombank"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 text-sm bg-slate-50"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Account Number */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase" htmlFor="w-num">Số tài khoản</label>
                  <input 
                    id="w-num"
                    type="text"
                    placeholder="e.g. 0071000..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 text-sm bg-slate-50"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                  />
                </div>

                {/* Account Holder */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase" htmlFor="w-holder">Chủ tài khoản</label>
                  <input 
                    id="w-holder"
                    type="text"
                    placeholder="e.g. NGUYEN VAN A"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 text-sm bg-slate-50 uppercase"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                    required
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setWithdrawOpen(false)}
                  className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50 transition-colors text-sm"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  disabled={withdrawLoading || withdrawSuccess}
                  className="flex-1 py-2 px-4 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-colors text-sm shadow disabled:opacity-50"
                >
                  {withdrawLoading ? 'Đang tạo...' : 'Xác nhận rút'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLender;
