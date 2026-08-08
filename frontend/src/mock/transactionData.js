/**
 * TypeScript / JSDoc Type Definitions & Mock Data for Transactions & Refund History
 */

/**
 * @typedef {'rental_payment' | 'deposit_charge' | 'deposit_refund' | 'cancellation_refund' | 'dispute_refund' | 'withdrawal' | 'top_up'} TransactionType
 */

/**
 * @typedef {'pending' | 'success' | 'failed'} RefundStatus
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id - Mã giao dịch
 * @property {string} [orderId] - Mã đơn hàng liên quan
 * @property {string} serviceName - Tên dịch vụ / thiết bị thuê
 * @property {string} createdAt - Thời gian giao dịch (ISO string)
 * @property {number} amount - Số tiền giao dịch (VND)
 * @property {'addition' | 'deduction'} flowType - Cộng tiền (+) hay Trừ tiền (-)
 * @property {TransactionType} category - Loại giao dịch
 * @property {string} paymentMethod - Phương thức thanh toán (VNPay, Bank Transfer, Wallet, etc.)
 * @property {string} status - Trạng thái giao dịch
 * @property {string} description - Diễn giải chi tiết
 */

/**
 * @typedef {Object} RefundItem
 * @property {string} refundId - Mã yêu cầu hoàn tiền
 * @property {string} orderId - Mã đơn hàng liên quan
 * @property {string} assetTitle - Tên thiết bị cắm trại / công nghệ
 * @property {string} requestDate - Ngày khởi tạo yêu cầu hoàn tiền
 * @property {string} [processedDate] - Ngày hoàn tất xử lý
 * @property {number} refundAmount - Số tiền hoàn lại (VND)
 * @property {'deposit_return' | 'order_cancelled' | 'dispute_settled'} refundType - Lý do/phân loại hoàn tiền
 * @property {RefundStatus} status - Trạng thái (pending, success, failed)
 * @property {string} refundMethod - Nơi nhận tiền hoàn (Ví EquipPeer / VNPay / Tài khoản ngân hàng)
 * @property {string} reason - Lý do hoặc mô tả hoàn tiền
 * @property {string} [failureReason] - Lý do thất bại (nếu có)
 */

export const MOCK_TRANSACTIONS = [
  {
    id: 'TXN-894210',
    orderId: 'ORD-2026-081',
    serviceName: 'Lều cắm trại 4 người chống nước cao cấp Naturehike',
    createdAt: '2026-08-03T14:30:00Z',
    amount: 1050000,
    flowType: 'deduction',
    category: 'rental_payment',
    paymentMethod: 'VNPAY - Thẻ ATM / QRPay',
    status: 'success',
    description: 'Thanh toán tiền thuê 3 ngày & ký quỹ cọc online'
  },
  {
    id: 'TXN-893541',
    orderId: 'ORD-2026-065',
    serviceName: 'Hoàn tiền cọc: Đèn bão Vintage Dã Ngoại Outdoor',
    createdAt: '2026-07-28T09:15:00Z',
    amount: 400000,
    flowType: 'addition',
    category: 'deposit_refund',
    paymentMethod: 'Ví EquipPeer Wallet',
    status: 'success',
    description: 'Hoàn 100% tiền cọc sau khi hoàn trả đồ thành công'
  },
  {
    id: 'TXN-889102',
    orderId: 'ORD-2026-052',
    serviceName: 'Bếp ga dã ngoại gấp gọn Namilux + bình gas',
    createdAt: '2026-07-20T16:45:00Z',
    amount: 450000,
    flowType: 'deduction',
    category: 'rental_payment',
    paymentMethod: 'VNPAY - Ví ZaloPay',
    status: 'success',
    description: 'Thanh toán tiền thuê 2 ngày'
  },
  {
    id: 'TXN-882190',
    orderId: 'ORD-2026-041',
    serviceName: 'Hoàn tiền cọc & thuê: Máy chiếu mini Anker Nebula Capsule',
    createdAt: '2026-07-10T11:20:00Z',
    amount: 1530000,
    flowType: 'addition',
    type: 'addition',
    category: 'cancellation_refund',
    paymentMethod: 'Ví EquipPeer Wallet',
    status: 'success',
    reason: 'Hoàn tiền cọc & tiền thuê sau khi hủy đơn (Đã trừ 15% phí phạt hủy: 270.000 đ)',
    description: 'Hoàn tiền cọc & tiền thuê sau khi hủy đơn (Đã trừ 15% phí phạt hủy: 270.000 đ)'
  },
  {
    id: 'TXN-874011',
    orderId: 'WTD-2026-009',
    serviceName: 'Rút tiền mặt về tài khoản Vietcombank',
    createdAt: '2026-06-25T18:00:00Z',
    amount: 1200000,
    flowType: 'deduction',
    category: 'withdrawal',
    paymentMethod: 'Chuyển khoản Ngân hàng (Vietcombank)',
    status: 'success',
    description: 'Yêu cầu rút tiền từ Ví khả dụng về STK 9988****12'
  }
];

export const MOCK_REFUNDS = [
  {
    refundId: 'REF-2026-091',
    orderId: 'ORD-2026-081',
    assetTitle: 'Lều cắm trại 4 người chống nước cao cấp Naturehike',
    requestDate: '2026-08-04T10:00:00Z',
    processedDate: null,
    refundAmount: 600000,
    refundType: 'deposit_return',
    status: 'pending',
    refundMethod: 'Ví EquipPeer Wallet',
    reason: 'Chờ chủ đồ nghiệm thu thiết bị và xác nhận hoàn cọc tự động'
  },
  {
    refundId: 'REF-2026-065',
    orderId: 'ORD-2026-065',
    assetTitle: 'Đèn bão Vintage Dã Ngoại Outdoor (Rechargeable)',
    requestDate: '2026-07-28T08:30:00Z',
    processedDate: '2026-07-28T09:15:00Z',
    refundAmount: 400000,
    refundType: 'deposit_return',
    status: 'success',
    refundMethod: 'Ví EquipPeer Wallet',
    reason: 'Hoàn cọc 100% sau khi trả đồ đúng hạn và thiết bị nguyên vẹn'
  },
  {
    refundId: 'REF-2026-041',
    orderId: 'ORD-2026-041',
    assetTitle: 'Máy chiếu mini Anker Nebula Capsule II Smart Portable',
    requestDate: '2026-07-10T11:00:00Z',
    processedDate: '2026-07-10T11:20:00Z',
    refundAmount: 1800000,
    refundType: 'order_cancelled',
    status: 'success',
    refundMethod: 'Ví EquipPeer Wallet',
    reason: 'Renter hủy đơn trước 24h khởi hành - Hoàn 100% tiền cọc + cước phí'
  },
  {
    refundId: 'REF-2026-018',
    orderId: 'ORD-2026-018',
    assetTitle: 'Bộ bàn ghế gấp gọn dã ngoại Naturehike 6 món',
    requestDate: '2026-06-15T15:20:00Z',
    processedDate: '2026-06-16T09:00:00Z',
    refundAmount: 250000,
    refundType: 'dispute_settled',
    status: 'failed',
    refundMethod: 'Tài khoản ngân hàng',
    reason: 'Từ chối hoàn full cọc do ghế bị rách vải canvas trong quá trình sử dụng. Đã trừ 250.000đ bồi thường.',
    failureReason: 'Khấu trừ hư hỏng theo biên bản bàn giao và phân xử của Admin'
  }
];
