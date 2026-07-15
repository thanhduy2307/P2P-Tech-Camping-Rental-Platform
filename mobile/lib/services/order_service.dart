import 'package:velox_mobile/core/api_client.dart';
import 'package:velox_mobile/models/order.dart';

class OrderService {
  /// Create an order; returns the order plus a VNPay payment URL.
  static Future<Map<String, dynamic>> createOrder({
    required String assetId,
    required String startDate,
    required String endDate,
    String depositMethod = 'online',
  }) async {
    final res = await ApiClient.post('/orders', {
      'assetId': assetId,
      'startDate': startDate,
      'endDate': endDate,
      'depositMethod': depositMethod,
    });
    return res;
  }

  static Future<List<Order>> getMyRentals() async {
    final res = await ApiClient.get('/orders/my-rentals');
    final list = res['data'] as List;
    return list.map((e) => Order.fromJson(e)).toList();
  }

  static Future<List<Order>> getIncoming() async {
    final res = await ApiClient.get('/orders/incoming');
    final list = res['data'] as List;
    return list.map((e) => Order.fromJson(e)).toList();
  }

  /// Lender confirms handover with OTP + 3-5 photos.
  static Future<Map<String, dynamic>> confirmHandover(
      String id, String otp, List<String> images) async {
    final res = await ApiClient.put('/orders/$id/handover',
        {'otp': otp, 'handoverImages': images});
    return res;
  }

  /// Lender confirms return with OTP + 3-5 photos.
  static Future<Map<String, dynamic>> confirmReturn(
      String id, String otp, List<String> images,
      {double? actualCashDepositReturned, String? cashDepositDeductionReason}) async {
    final body = <String, dynamic>{
      'otp': otp,
      'returnImages': images,
    };
    if (actualCashDepositReturned != null) {
      body['actualCashDepositReturned'] = actualCashDepositReturned;
    }
    if (cashDepositDeductionReason != null) {
      body['cashDepositDeductionReason'] = cashDepositDeductionReason;
    }
    final res = await ApiClient.put('/orders/$id/return', body);
    return res;
  }

  static Future<Map<String, dynamic>> cancelOrder(String id,
      {String? reason}) async {
    final res =
        await ApiClient.put('/orders/$id/cancel', {'reason': reason});
    return res;
  }

  static Future<Map<String, dynamic>> submitRating(
      String id, int rating, String? comment) async {
    final res = await ApiClient.post('/orders/$id/rate',
        {'rating': rating, if (comment != null) 'comment': comment});
    return res;
  }

  static Future<Map<String, dynamic>> raiseDispute(String id,
      {String? notes, String? disputeType}) async {
    final res = await ApiClient.put('/orders/$id/dispute',
        {'disputeNotes': notes, if (disputeType != null) 'disputeType': disputeType});
    return res;
  }
}
