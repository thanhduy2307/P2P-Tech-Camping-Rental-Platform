import 'package:flutter/material.dart';
import 'package:velox_mobile/core/storage.dart';
import 'package:velox_mobile/models/user.dart';
import 'package:velox_mobile/services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  User? _user;
  bool _loading = false;
  String? _error;

  User? get user => _user;
  bool get loading => _loading;
  String? get error => _error;
  bool get isLoggedIn => Storage.isLoggedIn();
  String? get role => _user?.role;

  AuthProvider() {
    _loadFromStorage();
  }

  void _loadFromStorage() {
    final data = Storage.getUser();
    if (data != null) _user = User.fromJson(data);
    notifyListeners();
  }

  void _setLoading(bool v) {
    _loading = v;
    notifyListeners();
  }

  Future<void> login(String emailOrPhone, String password) async {
    _setLoading(true);
    _error = null;
    try {
      final data = await AuthService.login(
          emailOrPhone: emailOrPhone, password: password);
      await AuthService.persistSession(data);
      _user = User.fromJson(data);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> registerEmail(
      String name, String email, String password, String role) async {
    _setLoading(true);
    _error = null;
    try {
      final data =
          await AuthService.register(name: name, email: email, password: password, role: role);
      await AuthService.persistSession(data);
      _user = User.fromJson(data);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<Map<String, dynamic>> registerPhone(
      String name, String phone, String password, String role) async {
    _setLoading(true);
    _error = null;
    try {
      final data = await AuthService.registerPhone(
          name: name, phoneNumber: phone, password: password, role: role);
      return data;
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> verifyOtp(String userId, String otp) async {
    _setLoading(true);
    _error = null;
    try {
      final data = await AuthService.verifyOtp(userId: userId, otp: otp);
      await AuthService.persistSession(data);
      _user = User.fromJson(data);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> refresh() async {
    try {
      final u = await AuthService.getMe();
      _user = u;
      await Storage.setUser(u.toJson());
      notifyListeners();
    } catch (_) {
      // token may be invalid; ignore refresh errors
    }
  }

  Future<void> switchRole({String? targetRole}) async {
    _setLoading(true);
    try {
      final data = await AuthService.switchRole(targetRole: targetRole);
      await AuthService.persistSession(data);
      _user = User.fromJson(data);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    await Storage.clear();
    _user = null;
    notifyListeners();
  }
}
