import 'package:velox_mobile/core/api_client.dart';
import 'package:velox_mobile/models/user.dart';

class UserService {
  static Future<User> getUserProfile(String userId) async {
    final res = await ApiClient.get('/auth/users/$userId/profile');
    return User.fromJson(res['data']);
  }
}
