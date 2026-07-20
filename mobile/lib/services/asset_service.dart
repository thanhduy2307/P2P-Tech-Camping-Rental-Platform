import 'package:velox_mobile/core/api_client.dart';
import 'package:velox_mobile/models/asset.dart';

class AssetService {
  /// Browse verified assets, optionally sorted by distance to the user.
  static Future<List<Asset>> getVerifiedAssets(
      {double? lat, double? lng}) async {
    final query = <String, String>{};
    if (lat != null) query['lat'] = lat.toString();
    if (lng != null) query['lng'] = lng.toString();
    final res = await ApiClient.get('/assets', query: query);
    final list = res['data'] as List? ?? [];
    return list.map((e) => Asset.fromJson(e)).toList();
  }

  static Future<Asset> getAssetById(String id) async {
    final res = await ApiClient.get('/assets/$id');
    return Asset.fromJson(res['data']);
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
    final res = await ApiClient.post('/assets', body);
    return res;
  }

  /// AI deposit + price estimation for lenders.
  static Future<Map<String, dynamic>> aiEstimateDeposit(
      Map<String, dynamic> body) async {
    final res = await ApiClient.post('/assets/ai-estimate-deposit', body);
    return res['data'];
  }

  /// AI gear recommendation from a free-text camping need.
  static Future<Map<String, dynamic>> recommend(String query) async {
    final res = await ApiClient.post('/assets/recommend', {'query': query});
    return res['data'];
  }
}

