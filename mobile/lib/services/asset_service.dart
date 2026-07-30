import 'package:velox_mobile/core/api_client.dart';
import 'package:velox_mobile/models/asset.dart';
import 'package:velox_mobile/models/review.dart';

class AssetService {
  static const _timeout = Duration(seconds: 180);
  /// Browse verified assets, optionally sorted by distance to the user.
  static Future<Map<String, dynamic>> getVerifiedAssets({
    double? lat, double? lng, int page = 1, int limit = 20
  }) async {
    final query = <String, String>{};
    if (lat != null) query['lat'] = lat.toString();
    if (lng != null) query['lng'] = lng.toString();
    query['page'] = page.toString();
    query['limit'] = limit.toString();
    final res = await ApiClient.get('/assets', query: query);
    final list = res['data'] as List? ?? [];
    final assets = list.map((e) => Asset.fromJson(e)).toList();
    return {
      'assets': assets,
      'total': res['total'] ?? assets.length,
      'page': res['page'] ?? page,
    };
  }

  static Future<Asset> getAssetById(String id) async {
    final res = await ApiClient.get('/assets/$id');
    return Asset.fromJson(res['data']);
  }

  static Future<Map<String, dynamic>> getAssetDetail(String id) async {
    final res = await ApiClient.get('/assets/$id');
    final data = res['data'] as Map<String, dynamic>;
    final reviews = (data['reviews'] as List?)
            ?.map((e) => Review.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];
    return {
      'asset': Asset.fromJson(data),
      'reviews': reviews,
    };
  }

  /// Lender: list own assets.
  static Future<List<Asset>> getMyAssets() async {
    final res = await ApiClient.get('/assets/my');
    final list = res['data'] as List? ?? [];
    return list.map((e) => Asset.fromJson(e)).toList();
  }

  /// Create a new asset listing.
  static Future<Map<String, dynamic>> createAsset(
      Map<String, dynamic> body) async {
    final res = await ApiClient.post('/assets', body, longRunning: true);
    return res;
  }

  /// AI deposit + price estimation for lenders.
  static Future<Map<String, dynamic>> aiEstimateDeposit(
      Map<String, dynamic> body) async {
    final res = await ApiClient.post('/assets/ai-estimate-deposit', body);
    return res['data'];
  }

  /// AI gear recommendation from a free-text camping need.
  static Future<Map<String, dynamic>> recommend(String query, {double? lat, double? lng, String? addressString}) async {
    final body = <String, dynamic>{'query': query};
    if (lat != null && lng != null) {
      body['lat'] = lat;
      body['lng'] = lng;
    }
    if (addressString != null && addressString.isNotEmpty) {
      body['addressString'] = addressString;
    }
    final res = await ApiClient.post('/assets/recommend', body);
    return res['data'];
  }

  /// Update asset (edit).
  static Future<Map<String, dynamic>> updateAsset(String id, Map<String, dynamic> body) async {
    final res = await ApiClient.put('/assets/$id', body, longRunning: true);
    return res;
  }

  /// Toggle asset status: verified / unavailable / maintenance.
  static Future<void> updateAssetStatus(String id, String status) async {
    await ApiClient.put('/assets/$id/status', {'status': status});
  }

  /// Get pending assets (inspector).
  static Future<List<Asset>> getPendingAssets() async {
    final res = await ApiClient.get('/assets/pending');
    final list = res['data'] as List? ?? [];
    return list.map((e) => Asset.fromJson(e)).toList();
  }

  /// Get disputed orders (inspector/admin).
  static Future<List<dynamic>> getDisputedOrders() async {
    final res = await ApiClient.get('/orders/disputed');
    return res['data'] as List? ?? [];
  }

  /// Block dates for an asset.
  static Future<void> blockDates(String id, String startDate, String endDate, {String? reason}) async {
    await ApiClient.put('/assets/$id/block-dates', {
      'startDate': startDate,
      'endDate': endDate,
      'reason': reason ?? 'manual',
    });
  }
}

