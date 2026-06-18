import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../configs/axios';

const Orders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const token = localStorage.getItem('token');
  const paymentStatus = searchParams.get('payment');

  // Clear query params after displaying notification to clean URL
  useEffect(() => {
    if (paymentStatus) {
      const timer = setTimeout(() => {
        // Clear query params but keep history intact
        setSearchParams({});
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, setSearchParams]);

  // Fetch renter orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/orders/my-rentals');
        if (response.data && response.data.success) {
          setOrders(response.data.data || []);
        } else {
          setError('Không thể lấy danh sách đơn hàng.');
        }
      } catch (err) {
        console.error(err);
        setError('Đã xảy ra lỗi khi tải danh sách đơn hàng.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  // Filter orders by active tab status
  const getFilteredOrders = () => {
    if (activeTab === 'all') return orders;
    if (activeTab === 'reserved') return orders.filter(o => o.status === 'reserved');
    if (activeTab === 'active') return orders.filter(o => o.status === 'active');
    if (activeTab === 'completed') return orders.filter(o => o.status === 'completed' || o.status === 'returned');
    if (activeTab === 'disputed') return orders.filter(o => o.status === 'disputed');
    return orders;
  };

  // Helper for rendering status badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'pending_payment':
        return (
          <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
            Chờ thanh toán
          </span>
        );
      case 'reserved':
        return (
          <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold border border-teal-200">
            Đã đặt cọc (Chờ giao đồ)
          </span>
        );
      case 'active':
        return (
          <span className="bg-primary-container/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
            Đang thuê (Đã nhận đồ)
          </span>
        );
      case 'returned':
        return (
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
            Đã trả (Chờ kiểm tra)
          </span>
        );
      case 'completed':
        return (
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
            Hoàn thành
          </span>
        );
      case 'disputed':
        return (
          <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200 animate-pulse">
            Tranh chấp
          </span>
        );
      default:
        return (
          <span className="bg-outline-variant text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl shadow-md text-center">
        <span className="material-symbols-outlined text-5xl text-outline mb-4">lock</span>
        <h2 className="text-xl font-bold mb-2">Vui lòng đăng nhập</h2>
        <p className="text-on-surface-variant text-sm mb-6">Bạn cần đăng nhập để xem danh sách đơn hàng đã đặt của mình.</p>
        <Link to="/login" className="bg-primary text-white px-6 py-2.5 rounded-lg shadow-sm hover:opacity-95 font-semibold transition-all">Đăng nhập ngay</Link>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <div className="bg-surface text-on-surface min-h-screen selection:bg-primary-container selection:text-on-primary-container antialiased font-body-md py-8">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop space-y-6">
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-3xl">receipt_long</span>
              Đơn hàng của tôi
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">Quản lý lịch sử thuê đồ dã ngoại và mã OTP nhận/giao trả sản phẩm.</p>
          </div>
        </div>

        {/* Payment Success/Fail Notification Banners */}
        {paymentStatus === 'success' && (
          <div className="bg-emerald-50 text-emerald-800 p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-start gap-3 animate-fade-in">
            <span className="material-symbols-outlined text-emerald-600 text-2xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <div>
              <h4 className="font-bold text-sm">Thanh toán cọc thành công!</h4>
              <p className="text-xs text-emerald-700/90 mt-1 leading-relaxed">
                Hệ thống đã nhận được tiền cọc. Đơn hàng của bạn đã chuyển sang trạng thái **Đã đặt cọc**. Vui lòng kiểm tra mã **OTP nhận đồ** ở chi tiết đơn hàng dưới đây khi gặp Lender bàn giao.
              </p>
            </div>
          </div>
        )}
        {paymentStatus === 'fail' && (
          <div className="bg-red-50 text-red-800 p-5 rounded-2xl border border-red-200 shadow-sm flex items-start gap-3 animate-fade-in">
            <span className="material-symbols-outlined text-red-600 text-2xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
            <div>
              <h4 className="font-bold text-sm">Giao dịch thanh toán thất bại</h4>
              <p className="text-xs text-red-700/90 mt-1 leading-relaxed">
                Đã xảy ra sự cố trong quá trình giao dịch qua cổng VNPay. Tiền cọc chưa được chuyển đi và đơn hàng chưa được kích hoạt. Vui lòng kiểm tra và thử thanh toán lại.
              </p>
            </div>
          </div>
        )}

        {/* Tab Controls */}
        <div className="border-b border-outline-variant flex gap-6 text-sm overflow-x-auto whitespace-nowrap scrollbar-none">
          <button 
            onClick={() => setActiveTab('all')} 
            className={`pb-3 font-bold transition-all relative ${activeTab === 'all' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Tất cả ({orders.length})
            {activeTab === 'all' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full"></span>}
          </button>
          <button 
            onClick={() => setActiveTab('reserved')} 
            className={`pb-3 font-bold transition-all relative ${activeTab === 'reserved' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Chờ giao đồ ({orders.filter(o => o.status === 'reserved').length})
            {activeTab === 'reserved' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full"></span>}
          </button>
          <button 
            onClick={() => setActiveTab('active')} 
            className={`pb-3 font-bold transition-all relative ${activeTab === 'active' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Đang thuê ({orders.filter(o => o.status === 'active').length})
            {activeTab === 'active' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full"></span>}
          </button>
          <button 
            onClick={() => setActiveTab('completed')} 
            className={`pb-3 font-bold transition-all relative ${activeTab === 'completed' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Đã hoàn thành ({orders.filter(o => o.status === 'completed' || o.status === 'returned').length})
            {activeTab === 'completed' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full"></span>}
          </button>
          <button 
            onClick={() => setActiveTab('disputed')} 
            className={`pb-3 font-bold transition-all relative ${activeTab === 'disputed' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Tranh chấp ({orders.filter(o => o.status === 'disputed').length})
            {activeTab === 'disputed' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full"></span>}
          </button>
        </div>

        {/* Loading and Error */}
        {loading && (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-4xl animate-spin text-primary">autorenew</span>
            <p className="text-on-surface-variant text-sm mt-2 font-medium">Đang tải danh sách đơn hàng...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Orders List */}
        {!loading && !error && (
          <div className="space-y-6">
            {filteredOrders.length === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl py-16 text-center space-y-4 shadow-sm">
                <span className="material-symbols-outlined text-outline text-5xl">receipt</span>
                <p className="text-on-surface-variant text-sm font-semibold">Bạn chưa có đơn hàng nào ở mục này.</p>
                <div className="pt-2">
                  <Link to="/assets" className="bg-primary text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow hover:opacity-95 transition-all">Khám phá thiết bị ngay</Link>
                </div>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const asset = order.asset || {};
                const assetImages = asset.images || [];
                const imageUrl = assetImages[0] || 'https://placehold.co/150?text=No+Image';
                
                return (
                  <div key={order._id} className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm flex flex-col lg:flex-row items-stretch gap-6 p-5 transition-transform duration-300 hover:shadow-md">
                    
                    {/* Left/Top: Product Image */}
                    <div className="w-full lg:w-48 h-36 rounded-xl bg-surface-container overflow-hidden border border-outline-variant/30 flex-shrink-0">
                      <img src={imageUrl} alt={asset.name || 'Equipment'} className="w-full h-full object-cover" />
                    </div>

                    {/* Middle: Details */}
                    <div className="flex-grow flex flex-col justify-between gap-3 min-w-0">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-xs text-outline font-bold">Mã đơn: #{order._id.substring(order._id.length - 8).toUpperCase()}</span>
                          <span className="w-1.5 h-1.5 bg-outline-variant rounded-full"></span>
                          {renderStatusBadge(order.status)}
                        </div>
                        <h3 className="text-lg font-bold text-on-surface hover:text-primary truncate">
                          <Link to={`/assets/${asset._id}`}>{asset.name || 'Tên thiết bị đã bị ẩn'}</Link>
                        </h3>
                        <p className="text-on-surface-variant text-xs mt-1.5 flex items-center">
                          <span className="material-symbols-outlined text-sm mr-1">date_range</span>
                          Thời gian: <strong className="ml-1 text-on-surface">{new Date(order.startDate).toLocaleDateString('vi-VN')}</strong> &rarr; <strong className="text-on-surface">{new Date(order.endDate).toLocaleDateString('vi-VN')}</strong> ({order.rentalDays} ngày)
                        </p>
                      </div>

                      {/* Billing breakdown */}
                      <div className="bg-surface-container-low/55 rounded-xl p-3.5 border border-outline-variant/30 text-xs space-y-1.5 max-w-md">
                        <div className="flex justify-between text-on-surface-variant">
                          <span>Tiền thuê thiết bị:</span>
                          <span className="font-bold text-on-surface">{order.totalRent.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div className="flex justify-between text-on-surface-variant">
                          <span>Đặt cọc hoàn lại:</span>
                          <span className="font-bold text-on-surface">{order.deposit.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div className="border-t border-outline-variant/40 pt-1.5 flex justify-between font-bold text-primary">
                          <span>Tổng số tiền đã trả:</span>
                          <span>{(order.totalRent + order.deposit).toLocaleString('vi-VN')} đ</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: OTP Security Panel & Action Buttons */}
                    <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-outline-variant/40 pt-4 lg:pt-0 lg:pl-6 flex flex-col justify-between gap-4 flex-shrink-0">
                      
                      {/* OTP codes display */}
                      <div className="space-y-3">
                        {order.status === 'reserved' && (
                          <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-200 shadow-inner">
                            <span className="text-[10px] text-teal-800 font-extrabold uppercase tracking-wide flex items-center gap-1 mb-1">
                              <span className="material-symbols-outlined text-xs">key</span>
                              OTP Bàn giao (Handover)
                            </span>
                            <div className="text-2xl font-extrabold text-teal-900 tracking-wider font-mono bg-white rounded-lg border border-teal-100 py-1.5 text-center shadow-sm">
                              {order.handoverOTP || '------'}
                            </div>
                            <p className="text-[9px] text-teal-700/80 mt-1.5 text-center leading-relaxed font-semibold">
                              Cung cấp mã này cho Lender khi gặp mặt kiểm tra thiết bị để nhận bàn giao.
                            </p>
                          </div>
                        )}

                        {order.status === 'active' && (
                          <div className="bg-primary-container/10 p-4 rounded-xl border border-primary/20 shadow-inner">
                            <span className="text-[10px] text-primary font-extrabold uppercase tracking-wide flex items-center gap-1 mb-1">
                              <span className="material-symbols-outlined text-xs">vpn_key</span>
                              OTP Trả đồ (Return)
                            </span>
                            <div className="text-2xl font-extrabold text-primary tracking-wider font-mono bg-white rounded-lg border border-primary/10 py-1.5 text-center shadow-sm">
                              {order.returnOTP || '------'}
                            </div>
                            <p className="text-[9px] text-primary/70 mt-1.5 text-center leading-relaxed font-semibold">
                              Cung cấp mã này cho Lender khi giao trả thiết bị để hoàn tất giao dịch.
                            </p>
                          </div>
                        )}

                        {order.status === 'pending_payment' && (
                          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                            <p className="text-[10px] text-amber-900/80 leading-relaxed font-medium">
                              Đơn hàng chưa hoàn thành ký quỹ. Cần thanh toán trước khi hết hạn giữ chỗ thiết bị.
                            </p>
                          </div>
                        )}

                        {['completed', 'returned'].includes(order.status) && (
                          <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100 flex flex-col items-center gap-1.5 text-center">
                            <span className="material-symbols-outlined text-emerald-600 text-3xl">verified</span>
                            <span className="text-xs font-bold text-emerald-950">Giao dịch đã kết thúc</span>
                            <p className="text-[9px] text-on-surface-variant leading-relaxed">
                              Thiết bị đã được giao trả thành công, tiền ký quỹ đã được tất toán.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2.5">
                        {order.status !== 'pending_payment' && asset?.depositAmount >= 2000000 && (
                          <a 
                            href={`http://localhost:5000/api/orders/${order._id}/contract?token=${localStorage.getItem('token')}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="w-full bg-white hover:bg-surface-container-low text-on-surface border border-outline font-semibold text-xs py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                            Xem Hợp đồng (PDF)
                          </a>
                        )}
                         <Link 
                          to={`/assets/${asset._id}`} 
                          className="w-full bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          Xem tin đăng gốc
                        </Link>
                        {asset?.lender && (
                          <button 
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('open-chat', {
                                detail: {
                                  userId: asset.lender._id || asset.lender,
                                  name: asset.lender.name || 'Lender',
                                  role: 'lender'
                                }
                              }));
                            }}
                            className="w-full bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-teal-200 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">chat</span>
                            Chat với Lender
                          </button>
                        )}
                      </div>

                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Orders;
