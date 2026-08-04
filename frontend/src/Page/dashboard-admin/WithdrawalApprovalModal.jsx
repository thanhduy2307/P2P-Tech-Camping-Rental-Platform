import React, { useState } from 'react';
import Swal from 'sweetalert2';
import api from '../../configs/axios';

const WithdrawalApprovalModal = ({ open, req, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const res = await api.put(`/auth/withdrawals/${req._id}/verify`, {
        status: 'approved',
        adminTransferInfo: 'Vietcombank-CTY CO PHAN EQUIPPEER',
        transactionReference: 'N/A',
        transferReceiptImage: ''
      });

      if (res.data && res.data.success) {
        Swal.fire({ icon: 'success', title: 'Thành công', text: 'Duyệt yêu cầu rút tiền thành công.' });
        onRefresh();
        onClose();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Thất bại', text: err.response?.data?.message || 'Có lỗi xảy ra.' });
    } finally {
      setLoading(false);
    }
  };

  if (!open || !req) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600">verified</span>
            Phê Duyệt Rút Tiền
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-sm font-medium text-slate-500 mb-1">Số tiền duyệt rút</p>
            <p className="text-3xl font-bold text-teal-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(req.amount)}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {req.bankAccount ? (
              <div className="flex flex-col items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm font-semibold text-slate-700">Dùng App Ngân Hàng quét QR bên dưới</p>
                <img 
                  src={`https://img.vietqr.io/image/${req.bankAccount.bankName.split(' ')[0]}-${req.bankAccount.accountNumber}-compact2.png?amount=${req.amount}&accountName=${encodeURIComponent(req.bankAccount.accountHolder)}&addInfo=ThanhToanTien`}
                  alt="VietQR"
                  className="w-56 h-56 object-contain rounded-lg border border-slate-100 shadow-sm"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="w-full text-center mt-2 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm font-bold text-slate-800">{req.bankAccount.accountHolder}</p>
                  <p className="text-xs text-slate-600 font-medium">{req.bankAccount.bankName}</p>
                  <p className="text-lg font-mono font-bold text-teal-700 tracking-wider mt-1">{req.bankAccount.accountNumber}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-600 italic text-center p-4 bg-red-50 rounded-lg">Không tìm thấy thông tin ngân hàng của người dùng!</p>
            )}

            <div className="pt-2">
              <p className="text-xs text-amber-600 italic text-center mb-4">
                * Lưu ý: Hãy chắc chắn bạn đã chuyển tiền thành công trước khi bấm duyệt.
              </p>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                  disabled={loading}
                >
                  Đóng
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-500/30 disabled:opacity-70 flex justify-center items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Đang xử lý...</>
                  ) : (
                    'Xác nhận đã chuyển tiền'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalApprovalModal;
