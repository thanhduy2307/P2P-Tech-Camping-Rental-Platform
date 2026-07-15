import Swal from 'sweetalert2';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../configs/axios';

const LenderOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Verification modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionType, setActionType] = useState('handover'); // 'handover' or 'return'
  const [otp, setOtp] = useState('');
  
  // Handover/Return image proofs (file objects + preview base64)
  const [imgFile1, setImgFile1] = useState(null);
  const [imgFile2, setImgFile2] = useState(null);
  const [imgFile3, setImgFile3] = useState(null);
  const [imgPreview1, setImgPreview1] = useState('');
  const [imgPreview2, setImgPreview2] = useState('');
  const [imgPreview3, setImgPreview3] = useState('');
  
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Cash deposit flow states
  const [actualCashDepositReturned, setActualCashDepositReturned] = useState('');
  const [cashDepositDeductionReason, setCashDepositDeductionReason] = useState('');
  const [cashDepositHandoverConfirmed, setCashDepositHandoverConfirmed] = useState(false);

  // Cancellation states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Rating states
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState('');

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
        Swal.fire(response.data.message || 'Gửi đánh giá Renter thành công!');
        setRatingModalOpen(false);
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
      setRatingError(err.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setRatingLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/orders/incoming');
      if (response.data?.success) {
        setOrders(response.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch incoming orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Helper to read a file as base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) { resolve(''); return; }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });
  };

  // Handle file selection with preview
  const handleFileChange = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (!file) return;
    setFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const [returnMode, setReturnMode] = useState('normal'); // 'normal' | 'dispute'

  const openActionModal = (order, type) => {
    setSelectedOrder(order);
    setActionType(type);
    setOtp('');
    setImgFile1(null); setImgPreview1('');
    setImgFile2(null); setImgPreview2('');
    setImgFile3(null); setImgPreview3('');
    setActionError('');
    setActualCashDepositReturned(order.deposit || '');
    setCashDepositDeductionReason('');
    setCashDepositHandoverConfirmed(false);
    setReturnMode('normal');
    setModalOpen(true);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    setActionError('');

    if (otp.length !== 6 || isNaN(otp)) {
      setActionError('Mã OTP phải gồm 6 chữ số.');
      return;
    }

    if (!imgFile1 || !imgFile2 || !imgFile3) {
      setActionError('Vui lòng chọn đầy đủ 3 hình ảnh làm bằng chứng đối chứng bàn giao.');
      return;
    }

    if (actionType === 'handover' && selectedOrder.depositMethod === 'cash' && !cashDepositHandoverConfirmed) {
      setActionError('Bạn phải xác nhận đã nhận đủ tiền đặt cọc mặt từ Renter.');
      return;
    }

    if (actionType === 'return' && returnMode === 'dispute') {
      if (!cashDepositDeductionReason.trim()) {
        setActionError('Vui lòng nhập lý do hỏng hóc và khiếu nại.');
        return;
      }
      if (selectedOrder.depositMethod === 'cash' && !cashDepositHandoverConfirmed) {
        setActionError('Vui lòng đánh dấu xác nhận cam kết giữ đúng tiền đền bù của cọc mặt.');
        return;
      }
      if (!actualCashDepositReturned || Number(actualCashDepositReturned) <= 0) {
        setActionError('Vui lòng nhập số tiền đền bù mong muốn.');
        return;
      }
    } else if (actionType === 'return' && selectedOrder.depositMethod === 'cash') {
      if (Number(actualCashDepositReturned) < selectedOrder.deposit && !cashDepositDeductionReason.trim()) {
        setActionError('Vui lòng nhập lý do khấu trừ tiền cọc mặt.');
        return;
      }
    }

    setActionLoading(true);
    try {
      // Convert files to base64
      const [b64_1, b64_2, b64_3] = await Promise.all([
        fileToBase64(imgFile1),
        fileToBase64(imgFile2),
        fileToBase64(imgFile3),
      ]);
      const images = [b64_1, b64_2, b64_3];

      let url = `/orders/${selectedOrder._id}/handover`;
      const payload = { otp };

      if (actionType === 'handover') {
        payload.handoverImages = images;
      } else {
        if (returnMode === 'dispute') {
          url = `/orders/${selectedOrder._id}/dispute`;
          payload.returnImages = images;
          payload.disputeNotes = cashDepositDeductionReason;
          payload.requestedDeductionAmount = Number(actualCashDepositReturned);
          payload.disputeType = 'damage_issue';
        } else {
          url = `/orders/${selectedOrder._id}/return`;
          payload.returnImages = images;
          if (selectedOrder.depositMethod === 'cash') {
            payload.actualCashDepositReturned = Number(actualCashDepositReturned);
            payload.cashDepositDeductionReason = cashDepositDeductionReason;
          }
        }
      }

      const response = await api.put(url, payload);
      if (response.data?.success) {
        Swal.fire(response.data.message || 'Xác nhận thành công!');
        setModalOpen(false);
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || 'Giao dịch thất bại. Vui lòng kiểm tra lại mã OTP.');
    } finally {
      setActionLoading(false);
    }
  };

  const openCancelModal = async (order) => {
    setOrderToCancel(order);
    setCancelReason('');
    
    const isPending = order.status === 'pending_payment';
    if (isPending) {
      const _swalRes = await Swal.fire({title: 'Bạn có chắc chắn muốn hủy đơn hàng chưa thanh toán này không? Sẽ không có hình phạt nào được áp dụng.', showCancelButton: true, confirmButtonText: "Đồng ý", cancelButtonText: "Hủy"});
      if (_swalRes.isConfirmed) {
        submitCancelOrder(order._id, '');
      }
    } else {
      setCancelModalOpen(true);
    }
  };

  const submitCancelOrder = async (orderId, reason) => {
    setCancelLoading(true);
    try {
      const response = await api.put(`/orders/${orderId}/cancel`, { reason });
      if (response.data?.success) {
        Swal.fire(response.data.message || 'Hủy đơn hàng thành công.');
        setCancelModalOpen(false);
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
      Swal.fire(err.response?.data?.message || 'Không thể hủy đơn hàng.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleApproveExtension = async (orderId, status) => {
    const actionName = status === 'approved' ? 'duyệt' : 'từ chối';
    const _swalRes = await Swal.fire({title: `Bạn có chắc chắn muốn ${actionName} yêu cầu gia hạn này?`, showCancelButton: true, confirmButtonText: "Đồng ý", cancelButtonText: "Hủy"});
    if (!_swalRes.isConfirmed) return;
    
    try {
      const response = await api.put(`/orders/${orderId}/extend/approve`, { status });
      if (response.data?.success) {
        Swal.fire(response.data.message || `Đã ${actionName} gia hạn thành công.`);
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
      Swal.fire(err.response?.data?.message || `Không thể ${actionName} yêu cầu gia hạn.`);
    }
  };

  const formatCurrency = (val) => {
    return val.toLocaleString('vi-VN') + ' đ';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-slate-500 font-medium">Đang tải danh sách đơn hàng...</p>
      </div>
    );
  }

  // Filter orders by categories
  const newOrders = orders.filter(o => ['pending_payment', 'reserved'].includes(o.status));
  const activeRentals = orders.filter(o => o.status === 'active');
  const completedOrders = orders.filter(o => ['completed', 'returned', 'disputed', 'cancelled'].includes(o.status));

  return (
    <div className="space-y-10">
      {/* 1. Category: New Requests */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm uppercase tracking-wider">
            <span className="material-symbols-outlined text-amber-500">pending_actions</span>
            Yêu cầu thuê mới &amp; Chờ nhận đồ ({newOrders.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          {newOrders.length === 0 ? (
            <p className="p-8 text-center text-slate-400 text-sm">Không có đơn hàng mới nào chờ xử lý.</p>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-55/20 text-slate-500 font-semibold border-b border-slate-100 text-xs uppercase">
                  <th className="px-6 py-3">Thiết bị</th>
                  <th className="px-6 py-3">Khách thuê (Renter)</th>
                  <th className="px-6 py-3">Thời gian thuê</th>
                  <th className="px-6 py-3">Doanh thu tạm tính</th>
                  <th className="px-6 py-3">Đặt cọc của khách</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {newOrders.map(order => (
                  <tr key={order._id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {order.asset?.name || 'Deleted Asset'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700 font-medium">{order.renter?.name || 'Renter'}</p>
                      <p className="text-slate-400 text-xs">{order.renter?.phoneNumber || 'No phone'}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(order.startDate).toLocaleDateString('vi-VN')} &rarr; {new Date(order.endDate).toLocaleDateString('vi-VN')}
                      <span className="block text-slate-400">({order.rentalDays} ngày)</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{formatCurrency(order.totalRent)}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      {formatCurrency(order.deposit)}
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        ({order.depositMethod === 'cash' ? 'Cọc tiền mặt' : 'Ký quỹ online'})
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        order.status === 'reserved' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {order.status === 'reserved' ? 'Đã cọc / Chờ bàn giao' : 'Chờ thanh toán'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        {order.status === 'reserved' && (
                          <button
                            onClick={() => openActionModal(order, 'handover')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5 px-3 rounded shadow transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                            Bàn giao
                          </button>
                        )}
                        <button
                          onClick={() => openCancelModal(order)}
                          className="border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold py-1.5 px-3 rounded transition-colors"
                        >
                          Hủy đơn
                        </button>
                        {order.renter && (
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('open-chat', {
                                detail: {
                                  userId: order.renter._id,
                                  name: order.renter.name || 'Renter',
                                  role: 'renter'
                                }
                              }));
                            }}
                            className="border border-teal-200 text-teal-600 hover:bg-teal-50 text-xs font-bold py-1.5 px-3 rounded transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">chat</span>
                            Chat
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 2. Category: Active Rentals */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm uppercase tracking-wider">
            <span className="material-symbols-outlined text-teal-500">cached</span>
            Đang cho thuê hoạt động ({activeRentals.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          {activeRentals.length === 0 ? (
            <p className="p-8 text-center text-slate-400 text-sm">Không có thiết bị nào đang trong chu kỳ cho thuê.</p>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-55/20 text-slate-500 font-semibold border-b border-slate-100 text-xs uppercase">
                  <th className="px-6 py-3">Thiết bị</th>
                  <th className="px-6 py-3">Khách thuê (Renter)</th>
                  <th className="px-6 py-3">Thời gian thuê</th>
                  <th className="px-6 py-3">Doanh thu thuê</th>
                  <th className="px-6 py-3">Giá trị cọc</th>
                  <th className="px-6 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeRentals.map(order => (
                  <tr key={order._id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {order.asset?.name || 'Deleted Asset'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700 font-medium">{order.renter?.name || 'Renter'}</p>
                      <p className="text-slate-400 text-xs">{order.renter?.phoneNumber || 'No phone'}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(order.startDate).toLocaleDateString('vi-VN')} &rarr; {new Date(order.endDate).toLocaleDateString('vi-VN')}
                      <span className="block text-slate-400">({order.rentalDays} ngày)</span>
                      {order.extensionStatus === 'pending' && (
                        <div className="mt-2 bg-blue-50 text-blue-700 p-2 rounded-md border border-blue-200 font-medium">
                          <strong>Khách xin gia hạn:</strong> {order.extensionDays} ngày <br/>
                          (Dự kiến: +{formatCurrency(order.extensionRent)})
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{formatCurrency(order.totalRent)}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      {formatCurrency(order.deposit)}
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        ({order.depositMethod === 'cash' ? 'Cọc tiền mặt' : 'Ký quỹ online'})
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2 flex-wrap">
                        {order.extensionStatus === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleApproveExtension(order._id, 'approved')}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1.5 px-3 rounded shadow transition-colors flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              Duyệt gia hạn
                            </button>
                            <button
                              onClick={() => handleApproveExtension(order._id, 'rejected')}
                              className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-1.5 px-3 rounded border border-red-200 transition-colors flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">cancel</span>
                              Từ chối
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => openActionModal(order, 'return')}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-1.5 px-3 rounded shadow transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">assignment_turned_in</span>
                            Nhận lại đồ
                          </button>
                        )}
                        {order.renter && (
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('open-chat', {
                                detail: {
                                  userId: order.renter._id,
                                  name: order.renter.name || 'Renter',
                                  role: 'renter'
                                }
                              }));
                            }}
                            className="border border-teal-200 text-teal-600 hover:bg-teal-50 text-xs font-bold py-1.5 px-3 rounded transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">chat</span>
                            Chat
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 3. Category: History (Completed/Cancelled) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm uppercase tracking-wider">
            <span className="material-symbols-outlined text-slate-500">history</span>
            Lịch sử đơn hàng ({completedOrders.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          {completedOrders.length === 0 ? (
            <p className="p-8 text-center text-slate-400 text-sm">Lịch sử trống.</p>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-55/20 text-slate-500 font-semibold border-b border-slate-100 text-xs uppercase">
                  <th className="px-6 py-3">Thiết bị</th>
                  <th className="px-6 py-3">Khách thuê (Renter)</th>
                  <th className="px-6 py-3">Thời gian thuê</th>
                  <th className="px-6 py-3">Doanh thu thu về</th>
                  <th className="px-6 py-3">Trạng thái cuối</th>
                  <th className="px-6 py-3">Báo cáo hợp đồng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedOrders.map(order => (
                  <tr key={order._id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {order.asset?.name || 'Deleted Asset'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700 font-medium">{order.renter?.name || 'Renter'}</p>
                      <p className="text-slate-400 text-xs">{order.renter?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(order.startDate).toLocaleDateString('vi-VN')} &rarr; {new Date(order.endDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{formatCurrency(order.totalRent)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                        order.status === 'disputed' ? 'bg-red-50 text-red-600' :
                        order.status === 'cancelled' ? 'bg-slate-100 text-slate-500' :
                        'bg-slate-150 text-slate-600'
                      }`}>
                        {order.status === 'completed' ? 'Hoàn thành' : 
                         order.status === 'cancelled' ? 'Đã hủy' : 
                         order.status === 'disputed' ? 'Tranh chấp' : 
                         order.status}
                      </span>
                      {order.status === 'disputed' && (
                        <p className="text-[9px] text-red-500 mt-1 font-semibold leading-tight">
                          Đang chờ Admin phán quyết (SLA 48h)
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        {order.asset?.depositAmount >= 2000000 ? (
                          <a 
                            href={`http://localhost:5000/api/orders/${order._id}/contract?token=${localStorage.getItem('token')}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-teal-600 hover:text-teal-700 hover:underline text-xs font-bold flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">description</span>
                            Hợp đồng điện tử
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Không yêu cầu</span>
                        )}
                        {order.renter && (
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('open-chat', {
                                detail: {
                                  userId: order.renter._id,
                                  name: order.renter.name || 'Renter',
                                  role: 'renter'
                                }
                              }));
                            }}
                            className="text-primary hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                          >
                            <span className="material-symbols-outlined text-sm">chat</span>
                            Chat với Renter
                          </button>
                        )}
                        {order.status === 'completed' && !order.renterRating && (
                          <button
                            onClick={() => {
                              setSelectedOrderForRating(order);
                              setRatingStars(5);
                              setRatingComment('');
                              setRatingError('');
                              setRatingModalOpen(true);
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] px-2.5 py-1 rounded shadow-sm transition-colors cursor-pointer border-none flex items-center gap-0.5 mt-1"
                          >
                            <span className="material-symbols-outlined text-xs">star</span>
                            Đánh giá Renter
                          </button>
                        )}
                        {order.renterRating && (
                          <div className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold mt-1">
                            Đã đánh giá Renter: {order.renterRating} ⭐
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* OTP verification modal for Handover/Return */}
      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-400">
                  {actionType === 'handover' ? 'local_shipping' : 'assignment_turned_in'}
                </span>
                {actionType === 'handover' ? 'Xác nhận bàn giao thiết bị' : 'Xác nhận thu hồi thiết bị'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleActionSubmit} className="p-6 space-y-4">
              {actionError && (
                <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-xs font-semibold">
                  {actionError}
                </div>
              )}

              <p className="text-xs text-slate-500 leading-relaxed">
                Yêu cầu Renter cung cấp mã bảo mật OTP trên ứng dụng của họ để nhập vào đây. Đồng thời, tải lên 3 ảnh thực tế của thiết bị làm bằng chứng trạng thái.
              </p>

              {actionType === 'return' && selectedOrder && (
                (() => {
                  const now = new Date();
                  const endDate = new Date(selectedOrder.endDate);
                  const msDiff = now - endDate;
                  const hoursLate = msDiff / (1000 * 60 * 60);
                  if (hoursLate > 4) {
                    const lateDays = 1 + Math.floor((hoursLate - 4) / 24);
                    const lateFee = lateDays * (selectedOrder.asset?.pricePerDay || 0) * 1.5;
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-900 mt-2 space-y-1">
                        <p className="font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">warning</span>
                          Cảnh báo trả đồ trễ hạn
                        </p>
                        <p>Renter đã trả đồ muộn <strong>{lateDays} ngày</strong> so với hợp đồng.</p>
                        {selectedOrder.depositMethod === 'online' ? (
                          <p>Hệ thống sẽ tự động trừ <strong>{lateFee.toLocaleString('vi-VN')} đ</strong> phí phạt từ cọc của Renter và cộng vào ví của bạn.</p>
                        ) : (
                          <p>Bạn cần khấu trừ <strong>{lateFee.toLocaleString('vi-VN')} đ</strong> từ tiền cọc mặt trước khi hoàn trả lại cho Renter.</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()
              )}

              {actionType === 'return' && (
                <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-1 mb-4">
                  <button
                    type="button"
                    onClick={() => setReturnMode('normal')}
                    className={`flex-1 text-[10px] font-bold py-1.5 rounded transition-all ${returnMode === 'normal' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    Thu hồi bình thường
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnMode('dispute')}
                    className={`flex-1 text-[10px] font-bold py-1.5 rounded transition-all ${returnMode === 'dispute' ? 'bg-red-50 shadow-sm text-red-700 border border-red-200' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    Báo cáo hư hỏng
                  </button>
                </div>
              )}

              {returnMode === 'dispute' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-900 mt-2 mb-4 space-y-2">
                  <p className="font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">gavel</span>
                    Khiếu nại hư hỏng
                  </p>
                  <p className="text-[10px] text-red-800 leading-normal mb-2">
                    Nhập chi tiết về hỏng hóc và số tiền bạn yêu cầu Renter đền bù. Đơn hàng sẽ bị khóa lại để Admin xử lý trong vòng 48h.
                  </p>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Số tiền yêu cầu đền bù (đ):</label>
                    <input 
                      type="number"
                      placeholder="e.g. 500000"
                      className="w-full border border-red-200 rounded px-2.5 py-1.5 font-bold focus:border-red-500"
                      value={actualCashDepositReturned}
                      onChange={(e) => setActualCashDepositReturned(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Lý do khiếu nại:</label>
                    <textarea 
                      placeholder="Mô tả hỏng hóc..."
                      className="w-full border border-red-200 rounded px-2.5 py-1.5 text-xs h-16 focus:border-red-500"
                      value={cashDepositDeductionReason}
                      onChange={(e) => setCashDepositDeductionReason(e.target.value)}
                    />
                  </div>
                  {selectedOrder.depositMethod === 'cash' && (
                    <label className="flex items-start gap-2 cursor-pointer mt-2 pt-2 border-t border-red-200/50">
                      <input 
                        type="checkbox" 
                        checked={cashDepositHandoverConfirmed}
                        onChange={(e) => setCashDepositHandoverConfirmed(e.target.checked)}
                        className="mt-0.5 accent-red-600"
                      />
                      <span className="text-[10px] font-semibold">
                        Tôi cam kết chỉ giữ lại đúng phần tiền đề xuất đền bù chờ Admin phán quyết, và đã hoàn trả phần tiền thừa (nếu có) lại cho Renter trực tiếp.
                      </span>
                    </label>
                  )}
                </div>
              )}

              {/* OTP Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700" htmlFor="order-otp">Nhập mã OTP bảo mật</label>
                <input 
                  id="order-otp"
                  type="text"
                  placeholder="e.g. 581903"
                  maxLength="6"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 tracking-widest text-center text-lg font-bold focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>

              {/* Cash Deposit Specific Inputs */}
              {actionType === 'handover' && selectedOrder.depositMethod === 'cash' && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-900 space-y-2 mt-2">
                  <p className="font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">payments</span>
                    Đơn hàng cọc tiền mặt trực tiếp
                  </p>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={cashDepositHandoverConfirmed}
                      onChange={(e) => setCashDepositHandoverConfirmed(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>Tôi xác nhận đã nhận đủ <strong>{selectedOrder.deposit.toLocaleString('vi-VN')} đ</strong> tiền đặt cọc mặt từ Renter.</span>
                  </label>
                </div>
              )}

              {actionType === 'return' && selectedOrder.depositMethod === 'cash' && returnMode === 'normal' && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-xs text-teal-950 space-y-3 mt-2">
                  <p className="font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">payments</span>
                    Hoàn cọc tiền mặt trực tiếp
                  </p>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Nhập số tiền cọc mặt thực tế bạn trả lại cho Renter và lý do khấu trừ tiền cọc nếu có tổn thất thiết bị nhỏ gọn không đáng khiếu nại.
                  </p>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Số tiền cọc thực trả lại (đ):</label>
                    <input 
                      type="number"
                      placeholder="e.g. 500000"
                      className="w-full border border-slate-200 rounded px-2.5 py-1.5 font-bold"
                      value={actualCashDepositReturned}
                      onChange={(e) => setActualCashDepositReturned(e.target.value)}
                      required={returnMode === 'normal'}
                    />
                  </div>
                  {Number(actualCashDepositReturned) < selectedOrder.deposit && (
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Lý do khấu trừ tiền cọc mặt:</label>
                      <textarea 
                        placeholder="Nhập lý do khấu trừ..."
                        className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs h-16"
                        value={cashDepositDeductionReason}
                        onChange={(e) => setCashDepositDeductionReason(e.target.value)}
                        required={returnMode === 'normal'}
                      />
                    </div>
                  )}
                </div>
              )}

              <hr className="border-slate-100" />
              <label className="text-xs font-semibold text-slate-700 block">Hình ảnh bằng chứng hiện trạng thiết bị (3 ảnh thực tế)</label>

              {/* Photo Upload - file picker with preview */}
              <div className="space-y-3">
                {[
                  { label: 'Ảnh 1: Toàn cảnh thiết bị', file: imgFile1, preview: imgPreview1, setFile: setImgFile1, setPreview: setImgPreview1, id: 'img-upload-1' },
                  { label: 'Ảnh 2: Cận cảnh tem niêm phong', file: imgFile2, preview: imgPreview2, setFile: setImgFile2, setPreview: setImgPreview2, id: 'img-upload-2' },
                  { label: 'Ảnh 3: Phụ kiện đi kèm', file: imgFile3, preview: imgPreview3, setFile: setImgFile3, setPreview: setImgPreview3, id: 'img-upload-3' },
                ].map(({ label, file, preview, setFile, setPreview, id }) => (
                  <div key={id} className="border border-dashed border-slate-300 rounded-lg p-2 flex items-center gap-3 bg-slate-50 hover:border-teal-400 transition-colors">
                    {/* Preview thumbnail */}
                    {preview ? (
                      <img src={preview} alt="preview" className="w-14 h-14 object-cover rounded-md border border-slate-200 flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-md border border-slate-200 bg-white flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-slate-300 text-2xl">add_photo_alternate</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-slate-600 mb-1">{label}</p>
                      <label
                        htmlFor={id}
                        className="cursor-pointer inline-flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">upload</span>
                        {file ? 'Đổi ảnh' : 'Chọn ảnh'}
                      </label>
                      {file && <span className="block text-[9px] text-slate-400 mt-1 truncate">{file.name}</span>}
                      <input
                        id={id}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, setFile, setPreview)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-650 font-bold hover:bg-slate-50 transition-colors text-sm"
                >
                  Đóng
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="flex-1 py-2 px-4 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-colors text-sm shadow disabled:opacity-50"
                >
                  {actionLoading ? 'Đang xác thực...' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rating & Review Modal for Lender to rate Renter */}
      {ratingModalOpen && selectedOrderForRating && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">star</span>
                Đánh giá khách thuê (Renter)
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
                Đánh giá mức độ hài lòng về ý thức sử dụng thiết bị và độ uy tín của khách thuê **{selectedOrderForRating.renter?.name}**.
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
                  {ratingStars === 5 ? 'Khách thuê xuất sắc (5/5)' :
                   ratingStars === 4 ? 'Khách thuê tốt (4/5)' :
                   ratingStars === 3 ? 'Bình thường (3/5)' :
                   ratingStars === 2 ? 'Không hài lòng (2/5)' : 'Rất tệ (1/5)'}
                </span>
              </div>

              {/* Comment text */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block" htmlFor="rating-comment">Ý kiến nhận xét</label>
                <textarea 
                  id="rating-comment"
                  rows="4"
                  placeholder="Nhận xét về việc giữ gìn đồ dùng, đúng hẹn trả đồ của Renter..."
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
                  className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-650 font-bold hover:bg-slate-55 transition-colors text-xs cursor-pointer bg-white"
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
      {/* -------------------- CANCEL MODAL -------------------- */}
      {cancelModalOpen && orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !cancelLoading && setCancelModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500">cancel</span>
                Hủy đơn hàng
              </h3>
              <button 
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelLoading}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-700 text-sm">
                <span className="material-symbols-outlined shrink-0 text-red-500">warning</span>
                <div>
                  <p className="font-bold mb-1">Cảnh báo hủy đơn đột xuất!</p>
                  <p>
                    Hệ thống sẽ hoàn trả 100% tiền thuê và cọc cho Renter. 
                    Nếu bạn hủy đơn dưới 24 giờ trước ngày khách nhận đồ, bạn sẽ bị phạt <strong>30% tiền thuê</strong> (trừ vào ví) và <strong>trừ 0.2 điểm uy tín</strong>.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Lý do hủy đơn <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Vui lòng nhập lý do cụ thể..."
                  className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  rows="3"
                ></textarea>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelLoading}
                className="px-5 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => submitCancelOrder(orderToCancel._id, cancelReason)}
                disabled={!cancelReason.trim() || cancelLoading}
                className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Đang xử lý...
                  </>
                ) : 'Xác nhận hủy đơn'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LenderOrders;
