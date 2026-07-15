import Swal from 'sweetalert2';
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../configs/axios';

const Orders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Rating and review states
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState('');

  // Extension states
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [selectedOrderForExtension, setSelectedOrderForExtension] = useState(null);
  const [extensionDays, setExtensionDays] = useState(1);
  const [extensionLoading, setExtensionLoading] = useState(false);

  // Image drafts for handover and return
  const [handoverDrafts, setHandoverDrafts] = useState({});
  const [returnDrafts, setReturnDrafts] = useState({});

  // Dispute states
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedOrderForDispute, setSelectedOrderForDispute] = useState(null);
  const [disputeNotes, setDisputeNotes] = useState('');
  
  const [defenseModalOpen, setDefenseModalOpen] = useState(false);
  const [defenseNotes, setDefenseNotes] = useState('');
  const handleSubmitRating = async (e) => {
    e.preventDefault();
    setRatingError('');
    setRatingLoading(true);
    try {
      const response = await api.post(`/orders/${selectedOrderForRating._id}/rate`, {
        rating: ratingStars,
        comment: ratingComment
      });
      if (response.data?.success) {
        Swal.fire(response.data.message || 'Gửi đánh giá thành công!');
        setRatingModalOpen(false);
        // Refresh orders list
        const res = await api.get('/orders/my-rentals');
        if (res.data && res.data.success) {
          setOrders(res.data.data || []);
        }
      }
    } catch (err) {
      console.error(err);
      setRatingError(err.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setRatingLoading(false);
    }
  };

  const handleRequestExtension = async (e) => {
    e.preventDefault();
    setExtensionLoading(true);
    try {
      const response = await api.post(`/orders/${selectedOrderForExtension._id}/extend`, { extensionDays: Number(extensionDays) });
      if (response.data?.success) {
        Swal.fire(response.data.message || 'Yêu cầu gia hạn đã được gửi.');
        setExtensionModalOpen(false);
        const res = await api.get('/orders/my-rentals');
        if (res.data?.success) setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      Swal.fire(err.response?.data?.message || 'Không thể gửi yêu cầu gia hạn.');
    } finally {
      setExtensionLoading(false);
    }
  };

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    if (!disputeNotes.trim()) return Swal.fire('Vui lòng nhập lý do khiếu nại');
    try {
      const response = await api.put(`/orders/${selectedOrderForDispute}/dispute`, { 
        disputeNotes,
        disputeType: 'quality_issue' 
      });
      if (response.data?.success) {
        Swal.fire('Thành công', 'Đã gửi khiếu nại. Vui lòng chờ Admin phân xử.', 'success');
        setDisputeModalOpen(false);
        const res = await api.get('/orders/my-rentals');
        if (res.data?.success) setOrders(res.data.data || []);
      }
    } catch (err) {
      Swal.fire('Lỗi', err.response?.data?.message || 'Lỗi khi gửi khiếu nại', 'error');
    }
  };

  const handleAcceptDeduction = async (orderId) => {
    const _swalRes = await Swal.fire({
      title: 'Xác nhận đền bù',
      text: 'Bạn có chắc chắn đồng ý với khoản đền bù này không? Hệ thống sẽ tự động trừ tiền cọc.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý đền bù',
      cancelButtonText: 'Không đồng ý'
    });
    
    if (!_swalRes.isConfirmed) return;
    
    try {
      const response = await api.put(`/orders/${orderId}/accept-deduction`);
      if (response.data?.success) {
        Swal.fire('Thành công', 'Đã xác nhận đền bù. Đơn hàng hoàn tất.', 'success');
        const res = await api.get('/orders/my-rentals');
        if (res.data?.success) setOrders(res.data.data || []);
      }
    } catch (err) {
      Swal.fire('Lỗi', err.response?.data?.message || 'Lỗi xác nhận đền bù', 'error');
    }
  };

  const handleDefense = async (e) => {
    e.preventDefault();
    if (!defenseNotes.trim()) return Swal.fire('Vui lòng nhập lời bào chữa');
    try {
      const response = await api.put(`/orders/${selectedOrderForDispute}/dispute-respond`, { renterDisputeNotes: defenseNotes });
      if (response.data?.success) {
        Swal.fire('Thành công', 'Đã gửi phản hồi thành công.', 'success');
        setDefenseModalOpen(false);
        const res = await api.get('/orders/my-rentals');
        if (res.data?.success) setOrders(res.data.data || []);
      }
    } catch (err) {
      Swal.fire('Lỗi', err.response?.data?.message || 'Lỗi khi gửi phản hồi', 'error');
    }
  };

  const handleCancelOrder = async (orderId, orderStatus) => {
    const confirmMsg = orderStatus === 'reserved'
      ? 'Bạn có chắc chắn muốn hủy đơn hàng ĐÃ ĐẶT CỌC này không? Tùy theo thời gian hủy so với lúc nhận đồ, bạn có thể bị trừ tiền cọc.'
      : 'Bạn có chắc chắn muốn hủy đơn hàng chưa thanh toán này không?';

    const _swalRes = await Swal.fire({
      title: confirmMsg,
      input: 'textarea',
      inputLabel: 'Lý do hủy đơn',
      inputPlaceholder: 'Vui lòng nhập lý do hủy đơn...',
      inputValidator: (value) => {
        if (!value) {
          return 'Bạn cần nhập lý do hủy đơn!';
        }
      },
      showCancelButton: true,
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy"
    });

    if (!_swalRes.isConfirmed) return;
    const reason = _swalRes.value;

    try {
      const response = await api.put(`/orders/${orderId}/cancel`, { reason });
      if (response.data?.success) {
        Swal.fire(response.data.message || 'Hủy đơn hàng thành công.');
        // Re-fetch to update list
        const res = await api.get('/orders/my-rentals');
        if (res.data?.success) setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      Swal.fire(err.response?.data?.message || 'Không thể hủy đơn hàng.');
    }
  };

  const handleContinuePayment = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/pay`);
      if (response.data?.success && response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      }
    } catch (err) {
      console.error(err);
      Swal.fire(err.response?.data?.message || 'Không thể tạo lại URL thanh toán.');
    }
  };


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

  const handlePickSingleImage = (orderId, type, index) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (type === 'handover') {
          setHandoverDrafts(prev => {
            const current = prev[orderId] || ['', '', ''];
            const next = [...current];
            next[index] = reader.result;
            return { ...prev, [orderId]: next };
          });
        } else {
          setReturnDrafts(prev => {
            const current = prev[orderId] || ['', '', ''];
            const next = [...current];
            next[index] = reader.result;
            return { ...prev, [orderId]: next };
          });
        }
      };
      reader.readAsDataURL(file);
    };
  };

  const handleSubmitHandoverImages = async (orderId) => {
    const images = handoverDrafts[orderId] || [];
    if (images.filter(i => i).length < 3) return Swal.fire('Vui lòng tải đủ 3 ảnh.');
    try {
      const res = await api.put(`/orders/${orderId}/renter-handover-images`, { images });
      if (res.data?.success) {
        Swal.fire('Tải ảnh thành công! Bạn có thể xem mã OTP.');
        window.location.reload();
      }
    } catch (err) {
      Swal.fire(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleSubmitReturnImages = async (orderId) => {
    const images = returnDrafts[orderId] || [];
    if (images.filter(i => i).length < 3) return Swal.fire('Vui lòng tải đủ 3 ảnh.');
    try {
      const res = await api.put(`/orders/${orderId}/renter-return-images`, { images });
      if (res.data?.success) {
        Swal.fire('Tải ảnh trả đồ thành công! Bạn có thể xem mã OTP.');
        window.location.reload();
      }
    } catch (err) {
      Swal.fire(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Filter orders by active tab status
  const getFilteredOrders = () => {
    if (activeTab === 'all') return orders;
    if (activeTab === 'reserved') return orders.filter(o => o.status === 'reserved');
    if (activeTab === 'active') return orders.filter(o => o.status === 'active');
    if (activeTab === 'completed') return orders.filter(o => o.status === 'completed' || o.status === 'returned');
    if (activeTab === 'cancelled') return orders.filter(o => o.status === 'cancelled');
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
      case 'cancelled':
        return (
          <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
            Đã hủy
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
            onClick={() => setActiveTab('cancelled')} 
            className={`pb-3 font-bold transition-all relative ${activeTab === 'cancelled' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Đã hủy ({orders.filter(o => o.status === 'cancelled').length})
            {activeTab === 'cancelled' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full"></span>}
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
                        {order.status === 'active' && new Date() > new Date(order.endDate) && (
                          <div className="mt-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs font-bold border border-red-200 flex items-start gap-1.5">
                            <span className="material-symbols-outlined text-sm mt-0.5">warning</span>
                            <span>Quá hạn trả đồ! Bạn sẽ bị phạt 150% giá thuê cho mỗi ngày trả muộn.</span>
                          </div>
                        )}

                        {/* Exact Pickup Location (Unlocked after deposit) */}
                        {order.status !== 'pending_payment' && asset.lender && (
                          <div className="mt-3 bg-primary/5 p-3.5 rounded-xl border border-primary/20 space-y-2 max-w-md">
                            <h4 className="font-bold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm">location_on</span>
                              Thông tin nhận đồ (Đã bảo mật)
                            </h4>
                            <div className="text-sm font-medium text-on-surface space-y-1.5">
                              <p className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-outline mt-0.5 text-base">home</span>
                                <span>{asset.location?.addressString || (asset.lender.address ? `${asset.lender.address.street}, ${asset.lender.address.ward}, ${asset.lender.address.district}, ${asset.lender.address.province}` : 'Đang cập nhật')}</span>
                              </p>
                              <p className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-outline text-base">call</span>
                                <span>{asset.lender.phoneNumber || 'Đang cập nhật'} ({asset.lender.name})</span>
                              </p>
                            </div>
                            <div className="pt-2 flex gap-2">
                              <a 
                                href={asset.location?.lat && asset.location?.lng ? `https://www.google.com/maps/search/?api=1&query=${asset.location.lat},${asset.location.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${asset.lender.address?.street || ''}, ${asset.lender.address?.ward || ''}, ${asset.lender.address?.district || ''}, ${asset.lender.address?.province || ''}`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 bg-white border border-primary/30 hover:bg-primary hover:text-white transition-colors text-primary font-bold text-xs py-2 rounded-lg flex justify-center items-center gap-1 shadow-sm"
                              >
                                <span className="material-symbols-outlined text-sm">directions</span>
                                Chỉ đường Google Maps
                              </a>
                              <button 
                                onClick={() => {
                                  window.dispatchEvent(new CustomEvent('open-chat', {
                                    detail: {
                                      userId: asset.lender._id,
                                      name: asset.lender.name,
                                      role: asset.lender.role
                                    }
                                  }));
                                }}
                                className="flex-1 bg-white border border-secondary/30 hover:bg-secondary hover:text-white transition-colors text-secondary font-bold text-xs py-2 rounded-lg flex justify-center items-center gap-1 shadow-sm"
                              >
                                <span className="material-symbols-outlined text-sm">chat</span>
                                Liên hệ chủ đồ
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Billing breakdown */}
                      <div className="bg-surface-container-low/55 rounded-xl p-3.5 border border-outline-variant/30 text-xs space-y-1.5 max-w-md">
                        <div className="flex justify-between text-on-surface-variant">
                          <span>Tiền thuê thiết bị (đã trả online):</span>
                          <span className="font-bold text-on-surface">{order.totalRent.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div className="flex justify-between text-on-surface-variant">
                          <span>
                            {order.depositMethod === 'cash' ? 'Đặt cọc trực tiếp (Tiền mặt):' : 'Ký quỹ đặt cọc online:'}
                          </span>
                          <span className="font-bold text-on-surface">
                            {order.deposit.toLocaleString('vi-VN')} đ
                            {order.depositMethod === 'cash' && !order.isCashDepositHandedOver && ' (Chưa giao)'}
                          </span>
                        </div>
                        {order.depositMethod === 'cash' && order.isCashDepositHandedOver && !order.isCashDepositReturned && (
                          <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                            <span>Trạng thái cọc mặt:</span>
                            <span>Đã giao cọc cho Lender</span>
                          </div>
                        )}
                        {order.depositMethod === 'cash' && order.isCashDepositReturned && (
                          <div className="flex flex-col gap-1 text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-100 mt-1">
                            <div className="flex justify-between text-[11px] font-semibold">
                              <span>Đã nhận lại cọc mặt:</span>
                              <span className="font-bold">{order.actualCashDepositReturned.toLocaleString('vi-VN')} đ</span>
                            </div>
                            {order.cashDepositDeductionReason && (
                              <div className="text-[10px] text-amber-800 italic">
                                * Lý do khấu trừ: {order.cashDepositDeductionReason}
                              </div>
                            )}
                          </div>
                        )}
                        {order.isLateReturn && (
                          <div className="flex justify-between text-red-700 font-semibold bg-red-50 px-2 py-1.5 rounded border border-red-100 mt-1">
                            <span>Phí phạt trả muộn ({order.lateDays} ngày):</span>
                            <span className="font-bold">{order.lateFee?.toLocaleString('vi-VN')} đ</span>
                          </div>
                        )}
                        <div className="border-t border-outline-variant/40 pt-1.5 flex justify-between font-bold text-primary">
                          <span>Tổng cộng thanh toán online:</span>
                          <span>
                            {(order.depositMethod === 'cash' ? order.totalRent : (order.totalRent + order.deposit)).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: OTP Security Panel & Action Buttons */}
                    <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-outline-variant/40 pt-4 lg:pt-0 lg:pl-6 flex flex-col justify-between gap-4 flex-shrink-0">
                      
                      {/* OTP codes display */}
                      <div className="space-y-3">
                        {order.status === 'reserved' && (
                          <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-200">
                            <span className="text-[10px] text-teal-800 font-extrabold uppercase tracking-wide flex items-center gap-1 mb-2">
                              <span className="material-symbols-outlined text-xs">checklist</span>
                              Kiểm tra trước khi nhận
                            </span>
                            <div className="text-[10px] text-teal-900 mb-3 space-y-1 font-medium bg-white p-2 rounded border border-teal-100">
                              <label className="flex items-start gap-1.5 cursor-pointer hover:bg-teal-50 p-0.5 rounded transition-colors">
                                <input type="checkbox" className="mt-0.5 accent-teal-600 cursor-pointer" />
                                <span>Đồ vật đúng như mô tả và hình ảnh</span>
                              </label>
                              <label className="flex items-start gap-1.5 cursor-pointer hover:bg-teal-50 p-0.5 rounded transition-colors">
                                <input type="checkbox" className="mt-0.5 accent-teal-600 cursor-pointer" />
                                <span>Không có nứt vỡ, mốc rễ rễ (đồ công nghệ) hoặc lủng rách (đồ cắm trại)</span>
                              </label>
                              <label className="flex items-start gap-1.5 cursor-pointer hover:bg-teal-50 p-0.5 rounded transition-colors">
                                <input type="checkbox" className="mt-0.5 accent-teal-600 cursor-pointer" />
                                <span>Đã cùng Lender chụp ảnh/quay video xác nhận lúc nhận</span>
                              </label>
                            </div>
                            {(!order.renterHandoverImages || order.renterHandoverImages.length < 3) ? (
                              <div className="bg-white p-3 rounded border border-teal-200 text-center">
                                <p className="text-[10px] font-bold text-teal-900 mb-2">Bắt buộc: Tải lên 3 ảnh nhận đồ</p>
                                <div className="flex gap-2 justify-center mb-3">
                                  {[0, 1, 2].map((idx) => (
                                    <div 
                                      key={idx}
                                      onClick={() => handlePickSingleImage(order._id, 'handover', idx)}
                                      className="w-16 h-16 rounded border-2 border-dashed border-teal-300 flex items-center justify-center cursor-pointer hover:bg-teal-50 overflow-hidden relative"
                                    >
                                      {handoverDrafts[order._id]?.[idx] ? (
                                        <img src={handoverDrafts[order._id][idx]} className="w-full h-full object-cover" alt="" />
                                      ) : (
                                        <span className="material-symbols-outlined text-teal-400 text-xl">add_a_photo</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <button
                                  onClick={() => handleSubmitHandoverImages(order._id)}
                                  className="w-full text-[10px] font-bold text-white bg-teal-600 hover:bg-teal-700 py-2 rounded shadow-sm transition-colors"
                                >
                                  Gửi ảnh & Nhận OTP
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="text-[10px] text-teal-800 font-extrabold uppercase tracking-wide flex items-center gap-1 mb-1">
                                  <span className="material-symbols-outlined text-xs">key</span>
                                  OTP Bàn giao (Handover)
                                </span>
                                <div className="text-2xl font-extrabold text-teal-900 tracking-wider font-mono bg-white rounded-lg border border-teal-100 py-1.5 text-center shadow-sm">
                                  {order.handoverOTP || '------'}
                                </div>
                                <p className="text-[9px] text-teal-700/80 mt-1.5 text-center leading-relaxed font-semibold mb-3">
                                  Cảnh báo: Chỉ cung cấp mã này cho Lender sau khi đã check đủ 3 điều kiện trên. Cung cấp mã này đồng nghĩa bạn xác nhận tình trạng đồ vật hoàn toàn bình thường.
                                </p>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => { setSelectedOrderForDispute(order._id); setDisputeModalOpen(true); }}
                              className="w-full text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 py-2 rounded-lg transition-colors cursor-pointer relative z-10 mt-2"
                            >
                              Từ chối nhận đồ & Khiếu nại
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelNoShow(order._id)}
                              className="w-full text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 py-2 rounded-lg transition-colors cursor-pointer relative z-10 mt-2"
                            >
                              Hủy đơn (Không liên hệ được Lender)
                            </button>
                          </div>
                        )}

                        {order.status === 'active' && (
                          <div className="bg-primary-container/10 p-4 rounded-xl border border-primary/20 shadow-inner">
                            {(!order.renterReturnImages || order.renterReturnImages.length < 3) ? (
                              <div className="bg-white p-3 rounded border border-primary/20 text-center">
                                <p className="text-[10px] font-bold text-primary mb-2">Bắt buộc: Tải lên 3 ảnh trả đồ</p>
                                <div className="flex gap-2 justify-center mb-3">
                                  {[0, 1, 2].map((idx) => (
                                    <div 
                                      key={idx}
                                      onClick={() => handlePickSingleImage(order._id, 'return', idx)}
                                      className="w-16 h-16 rounded border-2 border-dashed border-primary/30 flex items-center justify-center cursor-pointer hover:bg-primary/5 overflow-hidden relative"
                                    >
                                      {returnDrafts[order._id]?.[idx] ? (
                                        <img src={returnDrafts[order._id][idx]} className="w-full h-full object-cover" alt="" />
                                      ) : (
                                        <span className="material-symbols-outlined text-primary/40 text-xl">add_a_photo</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <button
                                  onClick={() => handleSubmitReturnImages(order._id)}
                                  className="w-full text-[10px] font-bold text-white bg-primary hover:bg-primary/90 py-2 rounded shadow-sm transition-colors"
                                >
                                  Gửi ảnh & Nhận OTP
                                </button>
                              </div>
                            ) : (
                              <>
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
                              </>
                            )}
                          </div>
                        )}

                        {order.status === 'pending_payment' && (
                          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                            <p className="text-[10px] text-amber-900/80 leading-relaxed font-medium">
                              Đơn hàng chưa hoàn thành ký quỹ. Cần thanh toán trước khi hết hạn giữ chỗ thiết bị.
                            </p>
                          </div>
                        )}

                        {order.status === 'cancelled' && (
                          <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-1.5 mb-1 text-slate-700">
                              <span className="material-symbols-outlined text-[16px]">info</span>
                              <span className="font-bold text-xs">Thông tin hủy đơn</span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                              {order.disputeNotes || 'Đơn hàng đã bị hủy không có lý do chi tiết.'}
                            </p>
                          </div>
                        )}

                        {order.status === 'disputed' && (
                          <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-center">
                            <span className="material-symbols-outlined text-red-600 text-3xl mb-1">gavel</span>
                            <h4 className="text-xs font-bold text-red-900 mb-2">Đơn hàng đang có tranh chấp</h4>
                            {order.disputeStatus === 'inspector_reviewed' ? (
                              <div className="bg-white p-3 rounded text-left border border-red-100">
                                <p className="text-[10px] text-red-800 font-semibold mb-1">
                                  Yêu cầu đền bù từ Lender: <span className="text-red-600">{order.requestedDeductionAmount?.toLocaleString('vi-VN')} đ</span>
                                </p>
                                <p className="text-[9px] text-red-700/80 mb-3">
                                  Inspector đã xem xét hóa đơn sửa chữa. Nếu bạn đồng ý, hệ thống sẽ trừ khoản này từ tiền cọc của bạn.
                                </p>
                                <button
                                  onClick={() => handleAcceptDeduction(order._id)}
                                  className="w-full text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 py-2 rounded shadow-sm transition-colors"
                                >
                                  Đồng ý đền bù
                                </button>
                              </div>
                            ) : (
                              <p className="text-[10px] text-red-800/80">
                                Vui lòng chờ Admin phân xử hoặc kiểm tra các thông báo khác.
                              </p>
                            )}
                          </div>
                        )}

                        {['completed', 'returned'].includes(order.status) && order.disputeStatus !== 'resolved' && (
                          <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100 flex flex-col items-center gap-1.5 text-center">
                            <span className="material-symbols-outlined text-emerald-600 text-3xl">verified</span>
                            <span className="text-xs font-bold text-emerald-950">Giao dịch đã kết thúc</span>
                            <p className="text-[9px] text-on-surface-variant leading-relaxed mb-2">
                              Thiết bị đã được giao trả thành công, tiền ký quỹ đã được tất toán.
                            </p>
                            {order.status === 'completed' && !order.lenderRating && (
                              <button
                                onClick={() => {
                                  setSelectedOrderForRating(order);
                                  setRatingStars(5);
                                  setRatingComment('');
                                  setRatingError('');
                                  setRatingModalOpen(true);
                                }}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-1.5 px-4 rounded-lg shadow-sm transition-colors cursor-pointer border-none"
                              >
                                Đánh giá thiết bị &amp; Lender
                              </button>
                            )}
                            {order.lenderRating && (
                              <div className="text-[10px] text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md font-bold mt-1">
                                Bạn đã đánh giá: {order.lenderRating} ⭐
                              </div>
                            )}
                            {order.asset?._id && (
                              <Link
                                to={`/assets/${order.asset._id}`}
                                className="mt-2 w-full inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-sm transition-colors no-underline"
                              >
                                <span className="material-symbols-outlined text-sm">replay</span>
                                Thuê lại
                              </Link>
                            )}
                          </div>
                        )}

                        {order.status === 'completed' && order.disputeStatus === 'resolved' && (
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center gap-1.5 text-center">
                            <span className="material-symbols-outlined text-slate-600 text-3xl">gavel</span>
                            <span className="text-xs font-bold text-slate-900">Tranh chấp đã được xử lý</span>
                            <p className="text-[10px] text-slate-600 leading-relaxed mb-2 font-medium">
                              Admin đã đưa ra phán quyết cuối cùng cho khiếu nại này.
                            </p>
                            {order.cashDepositDeductionReason && (
                              <div className="bg-white border border-slate-100 p-2 rounded w-full text-left">
                                <p className="text-[9px] text-slate-500 font-bold mb-0.5">Kết luận từ hệ thống:</p>
                                <p className="text-[10px] text-slate-800 font-medium">
                                  {order.cashDepositDeductionReason}
                                </p>
                              </div>
                            )}
                            {order.asset?._id && (
                              <Link
                                to={`/assets/${order.asset._id}`}
                                className="mt-2 w-full inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-sm transition-colors no-underline"
                              >
                                <span className="material-symbols-outlined text-sm">replay</span>
                                Xem lại thiết bị
                              </Link>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2.5">
                        {order.status === 'pending_payment' && (
                          <>
                            <button
                              onClick={() => handleContinuePayment(order._id)}
                              className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-sm">payment</span>
                              Thanh toán tiếp
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order._id, order.status)}
                              className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-red-200"
                            >
                              <span className="material-symbols-outlined text-sm">cancel</span>
                              Hủy đơn
                            </button>
                          </>
                        )}
                        {order.status === 'reserved' && (
                          <button
                            onClick={() => handleCancelOrder(order._id, order.status)}
                            className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-red-200"
                          >
                            <span className="material-symbols-outlined text-sm">cancel</span>
                            Hủy đơn
                          </button>
                        )}
                        {order.status === 'active' && order.extensionStatus !== 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedOrderForExtension(order);
                              setExtensionDays(1);
                              setExtensionModalOpen(true);
                            }}
                            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-blue-200"
                          >
                            <span className="material-symbols-outlined text-sm">update</span>
                            Gia hạn thêm ngày
                          </button>
                        )}
                        {order.status === 'active' && order.extensionStatus === 'pending' && (
                          <div className="w-full bg-amber-50 text-amber-700 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 border border-amber-200 text-center">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            Đang chờ duyệt gia hạn {order.extensionDays} ngày
                          </div>
                        )}
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

      {/* Rating & Review Modal */}
      {ratingModalOpen && selectedOrderForRating && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">star</span>
                Đánh giá thiết bị &amp; Lender
              </h3>
              <button 
                onClick={() => setRatingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center text-white border-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitRating} className="p-6 space-y-4">
              {ratingError && (
                <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-xs font-semibold">
                  {ratingError}
                </div>
              )}

              <p className="text-xs text-slate-500 leading-relaxed">
                Chia sẻ ý kiến của bạn về chất lượng thiết bị **{selectedOrderForRating.asset?.name}** và trải nghiệm giao dịch với Lender.
              </p>

              {/* Star selector */}
              <div className="space-y-1.5 text-center">
                <label className="text-xs font-bold text-slate-700 block">Chọn mức độ hài lòng</label>
                <div className="flex justify-center items-center gap-2 text-amber-500 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingStars(star)}
                      className="cursor-pointer bg-transparent border-none p-1 hover:scale-110 transition-transform"
                    >
                      <span 
                        className="material-symbols-outlined text-3xl"
                        style={{ fontVariationSettings: star <= ratingStars ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        star
                      </span>
                    </button>
                  ))}
                </div>
                <span className="text-xs font-extrabold text-slate-650 tracking-wide uppercase block">
                  {ratingStars === 5 ? 'Rất hài lòng (5/5)' :
                   ratingStars === 4 ? 'Hài lòng (4/5)' :
                   ratingStars === 3 ? 'Bình thường (3/5)' :
                   ratingStars === 2 ? 'Không hài lòng (2/5)' : 'Rất tệ (1/5)'}
                </span>
              </div>

              {/* Comment text */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block" htmlFor="rating-comment">Ý kiến đóng góp (Bình luận)</label>
                <textarea 
                  id="rating-comment"
                  rows="4"
                  placeholder="Nhập nhận xét của bạn về sản phẩm và thái độ phục vụ của chủ đồ..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none text-slate-800"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setRatingModalOpen(false)}
                  className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-55 transition-colors text-xs cursor-pointer bg-white"
                >
                  Đóng
                </button>
                <button 
                  type="submit" 
                  disabled={ratingLoading}
                  className="flex-1 py-2 px-4 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 transition-colors text-xs shadow disabled:opacity-50 cursor-pointer border-none"
                >
                  {ratingLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extension Modal */}
      {extensionModalOpen && selectedOrderForExtension && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-white">update</span>
                Yêu cầu gia hạn thuê đồ
              </h3>
              <button 
                onClick={() => setExtensionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-blue-700 hover:bg-blue-800 transition-colors flex items-center justify-center text-white border-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleRequestExtension} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Bạn muốn gia hạn thêm thời gian thuê cho thiết bị **{selectedOrderForExtension.asset?.name}**? Hãy nhập số ngày bạn muốn gia hạn. Yêu cầu này cần được Lender phê duyệt.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Số ngày muốn gia hạn thêm</label>
                <input 
                  type="number" 
                  min="1"
                  max="30"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800"
                  value={extensionDays}
                  onChange={(e) => setExtensionDays(e.target.value)}
                  required
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="flex justify-between text-xs text-blue-800">
                  <span>Phí thuê dự kiến:</span>
                  <span className="font-bold">{(selectedOrderForExtension.asset?.pricePerDay * extensionDays || 0).toLocaleString('vi-VN')} đ</span>
                </div>
                <p className="text-[10px] text-blue-600 mt-1 italic">
                  * Số tiền này sẽ được trừ từ số dư ví của bạn nếu Lender đồng ý gia hạn. Vui lòng đảm bảo ví đủ số dư.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setExtensionModalOpen(false)}
                  className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-55 transition-colors text-xs cursor-pointer bg-white"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  disabled={extensionLoading}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors text-xs shadow disabled:opacity-50 cursor-pointer border-none"
                >
                  {extensionLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Dispute Modal (Handover reject) */}
      {disputeModalOpen && selectedOrderForDispute && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 bg-red-600 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-white">gavel</span>
                Từ chối nhận & Khiếu nại
              </h3>
              <button 
                onClick={() => setDisputeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-red-700 hover:bg-red-800 transition-colors flex items-center justify-center text-white border-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <form onSubmit={handleRaiseDispute} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Vui lòng ghi rõ lý do bạn từ chối nhận thiết bị này (ví dụ: hỏng hóc, không đúng mô tả). Yêu cầu sẽ được chuyển đến Admin để phân xử và hoàn tiền.
              </p>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Lý do khiếu nại</label>
                <textarea 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800"
                  rows={4}
                  value={disputeNotes}
                  onChange={(e) => setDisputeNotes(e.target.value)}
                  required
                  placeholder="Mô tả chi tiết vấn đề..."
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setDisputeModalOpen(false)} className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-55 transition-colors text-xs cursor-pointer bg-white">Hủy</button>
                <button type="submit" className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors text-xs shadow cursor-pointer border-none">Gửi khiếu nại</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Defense Modal */}
      {defenseModalOpen && selectedOrderForDispute && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 bg-orange-500 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-white">shield</span>
                Phản hồi khiếu nại (Quyền bào chữa)
              </h3>
              <button 
                onClick={() => setDefenseModalOpen(false)}
                className="w-8 h-8 rounded-full bg-orange-600 hover:bg-orange-700 transition-colors flex items-center justify-center text-white border-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <form onSubmit={handleDefense} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Lender đã báo cáo rằng thiết bị bị hư hỏng khi bạn trả lại. Vui lòng cung cấp thông tin và bằng chứng từ phía bạn để Admin có cơ sở phân xử khách quan.
              </p>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Lời khai của bạn</label>
                <textarea 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-slate-800"
                  rows={4}
                  value={defenseNotes}
                  onChange={(e) => setDefenseNotes(e.target.value)}
                  required
                  placeholder="Ví dụ: Thiết bị đã bị xước từ lúc tôi nhận..."
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setDefenseModalOpen(false)} className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-55 transition-colors text-xs cursor-pointer bg-white">Hủy</button>
                <button type="submit" className="flex-1 py-2 px-4 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors text-xs shadow cursor-pointer border-none">Gửi bằng chứng</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
