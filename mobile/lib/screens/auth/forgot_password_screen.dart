import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:velox_mobile/providers/auth_provider.dart';
import 'package:velox_mobile/services/auth_service.dart';
import 'package:velox_mobile/widgets/common.dart';
import 'package:velox_mobile/widgets/brand_logo.dart';
import 'package:velox_mobile/widgets/velox_button.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  int _step = 1;
  final _phoneCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  String _userId = '';

  Future<void> _sendOtp() async {
    final phone = _phoneCtrl.text.trim();
    if (phone.isEmpty) { UiHelper.showErrorToast(context, 'Vui lòng nhập số điện thoại'); return; }
    setState(() => _loading = true);
    try {
      final data = await AuthService.forgotPassword(phone);
      if (!mounted) return;
      _userId = data['userId']?.toString() ?? '';
      setState(() { _step = 2; _loading = false; });
      if (data['otp'] != null) UiHelper.showSuccessToast(context, 'OTP: ${data['otp']}');
    } catch (e) {
      if (mounted) { setState(() => _loading = false); UiHelper.showErrorToast(context, e); }
    }
  }

  Future<void> _resetPassword() async {
    final otp = _otpCtrl.text.trim();
    final pass = _passCtrl.text;
    final confirm = _confirmCtrl.text;
    if (otp.isEmpty) { UiHelper.showErrorToast(context, 'Vui lòng nhập mã OTP'); return; }
    if (pass.length < 6) { UiHelper.showErrorToast(context, 'Mật khẩu phải có ít nhất 6 ký tự'); return; }
    if (pass != confirm) { UiHelper.showErrorToast(context, 'Mật khẩu xác nhận không khớp'); return; }
    setState(() => _loading = true);
    try {
      await AuthService.resetPassword(_userId, otp, pass);
      if (!mounted) return;
      setState(() { _step = 3; _loading = false; });
      UiHelper.showSuccessToast(context, 'Mật khẩu đã được đặt lại');
    } catch (e) {
      if (mounted) { setState(() => _loading = false); UiHelper.showErrorToast(context, e); }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F2F5),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 400),
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 24, offset: const Offset(0, 8))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Center(child: BrandLogo(size: 30)),
                  const SizedBox(height: 20),
                  Text(
                    _step == 1 ? 'Quên mật khẩu' : _step == 2 ? 'Nhập mã OTP' : 'Hoàn tất',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontFamily: 'PlusJakartaSans', fontWeight: FontWeight.w800, fontSize: 24),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _step == 1 ? 'Nhập số điện thoại để nhận mã đặt lại mật khẩu.' : _step == 2 ? 'Nhập mã OTP và tạo mật khẩu mới.' : 'Mật khẩu đã được đặt lại thành công!',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 14, color: Color(0xFF3C4A42)),
                  ),
                  const SizedBox(height: 24),
                  if (_step == 1) ...[
                    VeloxTextField(
                      label: 'Số điện thoại', hint: '09xxxxxxxx',
                      controller: _phoneCtrl, keyboardType: TextInputType.phone,
                      prefixIcon: const Icon(Icons.phone_outlined),
                    ),
                    const SizedBox(height: 24),
                    VeloxButton(label: 'Gửi mã OTP', loading: _loading, onPressed: _loading ? null : _sendOtp, icon: const Icon(Icons.send, size: 18)),
                  ],
                  if (_step == 2) ...[
                    VeloxTextField(
                      label: 'Mã OTP', hint: '6 chữ số',
                      controller: _otpCtrl, keyboardType: TextInputType.number,
                      prefixIcon: const Icon(Icons.pin_outlined),
                    ),
                    const SizedBox(height: 16),
                    VeloxTextField(
                      label: 'Mật khẩu mới', hint: '••••••••',
                      controller: _passCtrl, obscureText: _obscure,
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      ),
                    ),
                    const SizedBox(height: 16),
                    VeloxTextField(
                      label: 'Xác nhận mật khẩu', hint: '••••••••',
                      controller: _confirmCtrl, obscureText: true,
                      prefixIcon: const Icon(Icons.lock_outline),
                    ),
                    const SizedBox(height: 24),
                    VeloxButton(label: 'Đặt lại mật khẩu', loading: _loading, onPressed: _loading ? null : _resetPassword, icon: const Icon(Icons.key, size: 18)),
                    const SizedBox(height: 12),
                    Center(
                      child: TextButton(
                        onPressed: _loading ? null : _sendOtp,
                        child: const Text('Gửi lại mã OTP', style: TextStyle(color: Color(0xFF0058BE), fontWeight: FontWeight.w600)),
                      ),
                    ),
                  ],
                  if (_step == 3) ...[
                    const Icon(Icons.check_circle, color: Color(0xFF006C49), size: 72),
                    const SizedBox(height: 16),
                    const Text('Bạn có thể đăng nhập bằng mật khẩu mới.', textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: Color(0xFF3C4A42))),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981), foregroundColor: const Color(0xFF005236),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Text('Đăng nhập', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                        SizedBox(width: 8),
                        Icon(Icons.arrow_forward, size: 18),
                      ]),
                    ),
                  ],
                  if (_step != 3) ...[
                    const SizedBox(height: 20),
                    Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      const Text('Quay lại ', style: TextStyle(fontSize: 14)),
                      GestureDetector(
                        onTap: () => Navigator.pushReplacementNamed(context, '/login'),
                        child: const Text('Đăng nhập', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF0058BE))),
                      ),
                    ]),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
