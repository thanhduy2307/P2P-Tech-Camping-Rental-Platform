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

  const openActionModal = (order, type) => {
    setSelectedOrder(order);
    setActionType(type);
    setOtp('');
    setImgFile1(null); setImgPreview1('');
    setImgFile2(null); setImgPreview2('');
    setImgFile3(null); setImgPreview3('');
    setActionError('');
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
        url = `/orders/${selectedOrder._id}/return`;
        payload.returnImages = images;
      }

      const response = await api.put(url, payload);
      if (response.data?.success) {
        alert(response.data.message || 'Xác nhận thành công!');
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

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không? Việc hủy đơn đột xuất có thể bị phạt tài chính và trừ điểm uy tín theo quy định.')) {
      return;
    }

    try {
      const response = await api.put(`/orders/${orderId}/cancel`);
      if (response.data?.success) {
        alert(response.data.message || 'Hủy đơn hàng thành công.');
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Không thể hủy đơn hàng.');
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
  const completedOrders = orders.filter(o => ['completed', 'returned', 'disputed'].includes(o.status));

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
                    <td className="px-6 py-4 text-slate-600">{formatCurrency(order.deposit)}</td>
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
                          onClick={() => handleCancelOrder(order._id)}
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
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{formatCurrency(order.totalRent)}</td>
                    <td className="px-6 py-4 text-slate-600">{formatCurrency(order.deposit)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openActionModal(order, 'return')}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-1.5 px-3 rounded shadow transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">assignment_turned_in</span>
                          Nhận lại đồ
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
                        'bg-slate-150 text-slate-600'
                      }`}>
                        {order.status}
                      </span>
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
    </div>
  );
};

export default LenderOrders;
