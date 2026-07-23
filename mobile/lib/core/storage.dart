import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Thin wrapper around SharedPreferences to persist the auth token and the
/// current user JSON between sessions.
class Storage {
  static const String _tokenKey = 'velox_token';
  static const String _userKey = 'velox_user';
  static const String _roleKey = 'velox_role';

  static late SharedPreferences _prefs;

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  static Future<void> setToken(String token) async {
    await _prefs.setString(_tokenKey, token);
  }

  static String? getToken() => _prefs.getString(_tokenKey);

  static Future<void> setUser(Map<String, dynamic> user) async {
    await _prefs.setString(_userKey, jsonEncode(user));
    if (user['role'] != null) {
      await _prefs.setString(_roleKey, user['role'] as String);
    }
  }

  static Map<String, dynamic>? getUser() {
    final raw = _prefs.getString(_userKey);
    if (raw == null) return null;
    final decoded = jsonDecode(raw);
    return (decoded is Map<String, dynamic>) ? decoded : null;
  }

  static String? getRole() => _prefs.getString(_roleKey);

  static bool isLoggedIn() => getToken() != null;

  static Future<void> clear() async {
    await _prefs.remove(_tokenKey);
    await _prefs.remove(_userKey);
    await _prefs.remove(_roleKey);
  }
}
