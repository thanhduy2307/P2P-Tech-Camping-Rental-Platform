import 'package:velox_mobile/core/api_client.dart';
import 'package:velox_mobile/core/storage.dart';
import 'package:velox_mobile/models/user.dart';

class AuthService {
  /// Email/password registration (backend creates a virtual email for phone).
  static Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    String role = 'renter',
  }) async {
    final res = await ApiClient.post('/auth/register', {
      'name': name,
      'email': email,
      'password': password,
      'role': role,
    });
    return res['data'];
  }

  /// Phone registration -> returns userId + OTP (dev mode echoes OTP).
  static Future<Map<String, dynamic>> registerPhone({
    required String name,
    required String phoneNumber,
    required String password,
    String role = 'renter',
  }) async {
    final res = await ApiClient.post('/auth/register-phone', {
      'name': name,
      'phoneNumber': phoneNumber,
      'password': password,
      'role': role,
    });
    return res['data'];
  }

  static Future<Map<String, dynamic>> verifyOtp({
    required String userId,
    required String otp,
  }) async {
    final res = await ApiClient.post('/auth/verify-otp', {
      'userId': userId,
      'otp': otp,
    });
    return res['data'];
  }

  static Future<Map<String, dynamic>> login({
    required String emailOrPhone,
    required String password,
  }) async {
    final res = await ApiClient.post('/auth/login', {
      'email': emailOrPhone,
      'password': password,
    });
    return res['data'];
  }

  static Future<User> getMe() async {
    final res = await ApiClient.get('/auth/me');
    return User.fromJson(res['data']);
  }

  static Future<User> completeProfile({
    required String phoneNumber,
    required Map<String, dynamic> address,
    Map<String, dynamic>? bankAccount,
  }) async {
    final body = {
      'phoneNumber': phoneNumber,
      'address': address,
      if (bankAccount != null) 'bankAccount': bankAccount,
    };
    final res = await ApiClient.put('/auth/complete-profile', body);
    return User.fromJson(res['data']);
  }

  static Future<Map<String, dynamic>> switchRole({String? targetRole}) async {
    final res = await ApiClient.put('/auth/switch-role',
        targetRole != null ? {'targetRole': targetRole} : {});
    return res['data'];
  }

  static Future<Map<String, dynamic>> applyRenterEkyc({
    required String cccdFront,
    required String cccdBack,
    required String cccdSelfie,
  }) async {
    final res = await ApiClient.post('/auth/renter-onboarding', {
      'cccdFront': cccdFront,
      'cccdBack': cccdBack,
      'cccdSelfie': cccdSelfie,
    }, longRunning: true);
    return res['data'];
  }

  static Future<Map<String, dynamic>> applyLender({
    required String cccdFront,
    required String cccdBack,
    required String cccdSelfie,
    required Map<String, dynamic> bankAccount,
  }) async {
    final res = await ApiClient.post('/auth/lender-onboarding', {
      'cccdFront': cccdFront,
      'cccdBack': cccdBack,
      'cccdSelfie': cccdSelfie,
      'bankAccount': bankAccount,
    }, longRunning: true);
    return res['data'];
  }

  static Future<double> getBalance() async {
    final res = await ApiClient.get('/auth/balance');
    return (res['data']['balance'] as num).toDouble();
  }

  /// Persist token + user after a successful auth response.
  static Future<void> persistSession(Map<String, dynamic> data) async {
    if (data['token'] != null) await Storage.setToken(data['token']);
    await Storage.setUser(data);
  }
}
