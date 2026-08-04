import React, { useState, useEffect } from 'react';

/**
 * PreDepositModal Component
 * Modal cảnh báo và xác nhận thông tin trước khi đặt cọc / thanh toán.
 * Hiển thị tóm tắt đơn thuê, tiền cọc, điều khoản hủy/hoàn tiền và yêu cầu xác nhận checkbox.
 */
const PreDepositModal = ({ isOpen, onClose, onConfirm, bookingData, loading = false }) => {
  const [isAgreed, setIsAgreed] = useState(false);

  // Reset agreement state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setIsAgreed(false);
    }
  }, [isOpen]);

  if (!isOpen || !bookingData) return null;

  const {
    assetTitle = 'Thiết bị cắm trại',
    assetImage,
    category = 'Dụng cụ dã ngoại',
    startDate,
    endDate,
    rentalDays = 1,
    pricePerDay = 0,
    totalRent = 0,
    depositAmount = 0,
    totalAmount = 0,
    hasReputationDiscount = false,
    originalDeposit = 0
  } = bookingData;

  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div 
        className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[90vh] transition-all transform duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-primary text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <span className="material-symbols-outlined text-white text-2xl">shield_locked</span>
            </div>
            <div>
              <h3 className="font-title-md font-bold text-lg text-white leading-tight">Xác nhận thông tin & Điều khoản đặt cọc</h3>
              <p className="text-emerald-100 text-xs mt-0.5 font-medium">Bảo vệ quyền lợi Renter & Hoàn cọc tự động 100%</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full hover:bg-white/15 transition-colors flex items-center justify-center text-white/80 hover:text-white"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-5 text-on-surface font-body-md text-sm">
          
          {/* Item & Pricing Overview Box */}
          <div className="bg-surface-container-low/70 border border-outline-variant/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3 border-b border-outline-variant/40 pb-3">
              {assetImage ? (
                <img 
                  src={assetImage} 
                  alt={assetTitle} 
                  className="w-16 h-16 rounded-xl object-cover border border-outline-variant shrink-0" 
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-3xl">camping</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider block mb-0.5">{category}</span>
                <h4 className="font-bold text-on-surface text-base truncate">{assetTitle}</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Thời gian thuê: <strong className="text-on-surface">{rentalDays} ngày</strong> ({formatDate(startDate)} &rarr; {formatDate(endDate)})
                </p>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-on-surface-variant">
                <span>Tiền thuê thiết bị ({pricePerDay?.toLocaleString('vi-VN')} đ × {rentalDays} ngày):</span>
                <span className="font-semibold text-on-surface">{totalRent?.toLocaleString('vi-VN')} đ</span>
              </div>

              <div className="flex justify-between text-on-surface-variant items-center">
                <span className="flex items-center gap-1">
                  Ký quỹ đặt cọc online (Hoàn lại 100%):
                  {hasReputationDiscount && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold border border-emerald-200">
                      -20% Uy tín
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-1">
                  {hasReputationDiscount && originalDeposit > 0 && (
                    <span className="line-through text-slate-400 text-[11px]">
                      {originalDeposit?.toLocaleString('vi-VN')} đ
                    </span>
                  )}
                  <span className="font-semibold text-emerald-700">{depositAmount?.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <div className="pt-2 border-t border-outline-variant/40 flex justify-between items-center text-sm font-bold">
                <span className="text-on-surface">Tổng tiền thanh toán trước:</span>
                <span className="text-primary text-base font-extrabold">{totalAmount?.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          </div>

          {/* Deposit & Cancellation Terms Box */}
          <div className="border border-emerald-200/80 bg-emerald-50/40 rounded-2xl p-4 space-y-3">
            <h5 className="font-bold text-emerald-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-700 text-base">gavel</span>
              Chính sách hủy đơn & Quy trình hoàn cọc
            </h5>
            
            <ul className="space-y-2 text-xs text-slate-700 leading-relaxed list-none pl-0">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5">check_circle</span>
                <span>
                  <strong>Hủy đơn trước 24h:</strong> Hoàn trả <strong>100% tiền cọc + 100% tiền thuê</strong> về tài khoản/ví của bạn.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-amber-600 text-base shrink-0 mt-0.5">warning</span>
                <span>
                  <strong>Hủy đơn trong vòng 24h trước khi nhận:</strong> Hoàn trả <strong>100% tiền cọc</strong>, tính phí hủy 50% tiền thuê để bồi thường cho chủ đồ.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-blue-600 text-base shrink-0 mt-0.5">published_with_changes</span>
                <span>
                  <strong>Quy trình hoàn cọc tự động:</strong> Sau khi bạn hoàn trả thiết bị thành công và Chủ đồ xác nhận nguyên vẹn, hệ thống tự động hoàn lại <strong className="text-emerald-700">{depositAmount?.toLocaleString('vi-VN')} đ</strong> về số dư ví/tài khoản ngân hàng của bạn trong vòng 24h.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-purple-600 text-base shrink-0 mt-0.5">handshake</span>
                <span>
                  <strong>Bảo vệ tranh chấp:</strong> EquipPeer cam kết hỗ trợ giải quyết công bằng nếu phát sinh sự cố hư hỏng hoặc chậm trễ bàn giao.
                </span>
              </li>
            </ul>
          </div>

          {/* Checkbox agreement */}
          <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/60 flex items-start gap-3">
            <input 
              type="checkbox" 
              id="tosDepositCheck"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary shrink-0"
            />
            <label htmlFor="tosDepositCheck" className="text-xs text-on-surface font-medium leading-relaxed cursor-pointer select-none">
              Tôi đã đọc, hiểu rõ và đồng ý với <strong>Tóm tắt khoản cọc</strong>, <strong>Chính sách bồi thường hư hỏng</strong> và <strong>Quy định hủy/hoàn tiền</strong> của nền tảng EquipPeer.
            </label>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-surface-container-low px-6 py-4 border-t border-outline-variant/40 flex items-center justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-outline text-on-surface text-xs font-bold hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          
          <button 
            type="button"
            onClick={onConfirm}
            disabled={!isAgreed || loading}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 ${
              isAgreed && !loading
                ? 'bg-primary text-white hover:bg-emerald-800 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">autorenew</span>
                Đang xử lý...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">lock_reset</span>
                Xác nhận thanh toán ({totalAmount?.toLocaleString('vi-VN')} đ)
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PreDepositModal;
