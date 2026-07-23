import 'package:velox_mobile/core/api_client.dart';

class InspectorService {
  /// Lấy danh sách nhiệm vụ kiểm định được gán cho inspector hiện tại.
  /// Mỗi item là một Asset kèm `taskDetails` (taskId, isRemote, distance, assignedAt).
  static Future<List<Map<String, dynamic>>> getPendingTasks() async {
    final res = await ApiClient.get('/assets/pending');
    final list = res['data'] as List? ?? [];
    return list
        .whereType<Map<String, dynamic>>()
        .toList();
  }

  /// Lấy danh sách đơn hàng đang có khiếu nại (disputed).
  static Future<List<Map<String, dynamic>>> getDisputedOrders() async {
    final res = await ApiClient.get('/orders/disputed');
    final list = res['data'] as List? ?? [];
    return list
        .whereType<Map<String, dynamic>>()
        .toList();
  }

  /// Duyệt/từ chối một tài sản.
  /// [status] phải là 'verified' | 'rejected' | 'unavailable'.
  /// [checklist] bắt buộc khi duyệt (verified) và task là kiểm định tận nơi (offline).
  static Future<Map<String, dynamic>> verifyAsset(
    String assetId, {
    required String status,
    String? verificationNotes,
    Map<String, dynamic>? checklist,
  }) async {
    final body = <String, dynamic>{
      'status': status,
      'verificationNotes': verificationNotes,
      'inspectionChecklist': checklist,
    }..removeWhere((k, v) => v == null);
    final res =
        await ApiClient.put('/assets/$assetId/verify', body);
    return res;
  }

  /// Xử lý (giải quyết) một khiếu nại đơn hàng.
  static Future<Map<String, dynamic>> resolveDispute(
    String orderId, {
    required String action,
    double? lenderCompensation,
    double? renterRefund,
  }) async {
    final body = <String, dynamic>{
      'action': action,
      if (lenderCompensation != null) 'lenderCompensation': lenderCompensation,
      if (renterRefund != null) 'renterRefund': renterRefund,
    };
    final res =
        await ApiClient.put('/orders/$orderId/resolve-dispute', body);
    return res;
  }
}
