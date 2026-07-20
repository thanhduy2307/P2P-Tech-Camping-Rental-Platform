import 'package:velox_mobile/core/api_client.dart';
import 'package:velox_mobile/models/asset.dart';
import 'package:velox_mobile/models/order.dart';
import 'package:velox_mobile/models/user.dart';

class AdminService {
  /// GET /api/admin/stats
  static Future<Map<String, dynamic>> getStats() async {
    final res = await ApiClient.get('/admin/stats');
    return res['data'];
  }

  /// GET /api/admin/users?role=&search=
  static Future<List<User>> getUsers({String? role, String? search}) async {
    final query = <String, String>{};
    if (role != null && role != 'all') query['role'] = role;
    if (search != null && search.trim().isNotEmpty) query['search'] = search.trim();
    final res = await ApiClient.get('/admin/users', query: query.isEmpty ? null : query);
    final list = res['data'] as List;
    return list.map((e) => User.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// PUT /api/admin/users/:id/role
  static Future<User> updateUserRole(String id, String role) async {
    final res = await ApiClient.put('/admin/users/$id/role', {'role': role});
    return User.fromJson(res['data']);
  }

  /// PUT /api/admin/users/:id/ban
  static Future<User> toggleBan(String id) async {
    final res = await ApiClient.put('/admin/users/$id/ban', {});
    return User.fromJson(res['data']);
  }

  /// GET /api/admin/assets?status=
  static Future<List<Asset>> getAssets({String? status}) async {
    final query = <String, String>{};
    if (status != null && status != 'all') query['status'] = status;
    final res = await ApiClient.get('/admin/assets', query: query.isEmpty ? null : query);
    final list = res['data'] as List;
    return list.map((e) => Asset.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// GET /api/admin/orders?status=
  static Future<List<Order>> getOrders({String? status}) async {
    final query = <String, String>{};
    if (status != null && status != 'all') query['status'] = status;
    final res = await ApiClient.get('/admin/orders', query: query.isEmpty ? null : query);
    final list = res['data'] as List;
    return list.map((e) => Order.fromJson(e as Map<String, dynamic>)).toList();
  }

  // ===== eKYC & Withdrawal (located under /api/auth, admin-only) =====

  /// GET /api/auth/renter-applications  (pending renter eKYC)
  static Future<List<User>> getRenterApplications() async {
    final res = await ApiClient.get('/auth/renter-applications');
    final list = res['data'] as List;
    return list.map((e) => User.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// GET /api/auth/lender-applications  (pending lender eKYC)
  static Future<List<User>> getLenderApplications() async {
    final res = await ApiClient.get('/auth/lender-applications');
    final list = res['data'] as List;
    return list.map((e) => User.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// PUT /api/auth/renter-applications/:id/verify  {status, rejectReason?}
  static Future<void> verifyRenterApplication(String id, String status, {String? rejectReason}) async {
    await ApiClient.put('/auth/renter-applications/$id/verify',
        {'status': status, if (rejectReason != null) 'rejectReason': rejectReason});
  }

  /// PUT /api/auth/lender-applications/:id/verify  {status, rejectReason?}
  static Future<void> verifyLenderApplication(String id, String status, {String? rejectReason}) async {
    await ApiClient.put('/auth/lender-applications/$id/verify',
        {'status': status, if (rejectReason != null) 'rejectReason': rejectReason});
  }

  /// GET /api/auth/withdrawals
  static Future<List<dynamic>> getWithdrawals() async {
    final res = await ApiClient.get('/auth/withdrawals');
    return (res['data'] as List).cast<Map<String, dynamic>>();
  }

  /// PUT /api/auth/withdrawals/:id/verify  {status, rejectReason?}
  static Future<void> verifyWithdrawal(String id, String status, {String? rejectReason}) async {
    await ApiClient.put('/auth/withdrawals/$id/verify',
        {'status': status, if (rejectReason != null) 'rejectReason': rejectReason});
  }
}
