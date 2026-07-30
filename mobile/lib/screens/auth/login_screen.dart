import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:velox_mobile/providers/auth_provider.dart';
import 'package:velox_mobile/main.dart';
import 'package:velox_mobile/services/auth_service.dart';
import 'package:velox_mobile/widgets/common.dart';
import 'package:velox_mobile/widgets/brand_logo.dart';
import 'package:velox_mobile/widgets/velox_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscure = true;
  bool _remember = true;

  Future<void> _submit() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    try {
      await auth.login(_emailController.text.trim(), _passwordController.text);
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, AppRoutes.homeForRole(auth.role, lenderStatus: auth.user?.lenderStatus));
    } catch (e) {
      UiHelper.showErrorToast(context, e);
    }
  }

  Future<void> _googleSignIn() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    try {
      final data = await AuthService.startGoogleAuth();
      if (!mounted) return;
      final authUrl = data['authUrl']?.toString();
      final sessionId = data['sessionId']?.toString();
      if (authUrl == null || sessionId == null) {
        UiHelper.showErrorToast(context, 'Google Auth không khả dụng');
        return;
      }
      await launchUrl(Uri.parse(authUrl), mode: LaunchMode.externalApplication);
      if (!mounted) return;
      final result = await showDialog<String>(
        context: context,
        barrierDismissible: false,
        builder: (_) => _GoogleAuthPollingDialog(sessionId: sessionId),
      );
      if (!mounted) return;
      if (result == 'done') {
        await auth.refresh();
        if (!mounted) return;
        Navigator.pushReplacementNamed(context, AppRoutes.homeForRole(auth.role, lenderStatus: auth.user?.lenderStatus));
      } else if (result != null) {
        UiHelper.showErrorToast(context, result);
      }
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
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
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 24, offset: const Offset(0, 8)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Center(child: BrandLogo(size: 30)),
                  const SizedBox(height: 20),
                  const Text(
                    'Chào mừng trở lại!',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontFamily: 'PlusJakartaSans', fontWeight: FontWeight.w800, fontSize: 24),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Đăng nhập để thuê và cho thuê thiết bị cắm trại',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 14, color: Color(0xFF3C4A42)),
                  ),
                  const SizedBox(height: 24),
                  VeloxTextField(
                    label: 'Email hoặc SĐT',
                    hint: 'you@example.com',
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    prefixIcon: const Icon(Icons.mail_outline),
                  ),
                  const SizedBox(height: 16),
                  VeloxTextField(
                    label: 'Mật khẩu',
                    hint: '••••••••',
                    controller: _passwordController,
                    obscureText: _obscure,
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Checkbox(
                        value: _remember,
                        onChanged: (v) => setState(() => _remember = v ?? true),
                        visualDensity: VisualDensity.compact,
                        activeColor: const Color(0xFF0058BE),
                      ),
                      const Text('Ghi nhớ tôi', style: TextStyle(fontSize: 13)),
                      const Spacer(),
                      TextButton(
                        onPressed: () {},
                        child: const Text('Quên mật khẩu?'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  VeloxButton(
                    label: 'Đăng nhập',
                    loading: auth.loading,
                    onPressed: auth.loading ? null : _submit,
                    icon: const Icon(Icons.arrow_forward, size: 18),
                  ),
                  Center(
                    child: GestureDetector(
                      onTap: () => Navigator.pushNamed(context, '/forgot-password'),
                      child: const Text('Quên mật khẩu?', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF0058BE))),
                    ),
                  ),
                  const SizedBox(height: 18),
                  const Row(
                    children: [
                      Expanded(child: Divider()),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12),
                        child: Text('Hoặc đăng nhập với', style: TextStyle(fontSize: 13, color: Color(0xFF3C4A42))),
                      ),
                      Expanded(child: Divider()),
                    ],
                  ),
                  const SizedBox(height: 18),
                  VeloxButton(
                    label: 'Google',
                    outline: true,
                    icon: const Icon(Icons.g_mobiledata, size: 22),
                    onPressed: _googleSignIn,
                  ),
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Chưa có tài khoản? ', style: TextStyle(fontSize: 14)),
                      GestureDetector(
                        onTap: () => Navigator.pushNamed(context, '/register'),
                        child: const Text('Đăng ký ngay', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF0058BE))),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _GoogleAuthPollingDialog extends StatefulWidget {
  final String sessionId;
  const _GoogleAuthPollingDialog({required this.sessionId});

  @override
  State<_GoogleAuthPollingDialog> createState() => _GoogleAuthPollingDialogState();
}

class _GoogleAuthPollingDialogState extends State<_GoogleAuthPollingDialog> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _poll();
    _timer = Timer.periodic(const Duration(seconds: 2), (_) => _poll());
  }

  Future<void> _poll() async {
    try {
      final data = await AuthService.pollGoogleSession(widget.sessionId);
      if (!mounted) return;
      if (data == null) return;
      _timer?.cancel();
      final status = data['status'] as String?;
      if (status == 'done') {
        await AuthService.persistSession(data);
        if (mounted) Navigator.pop(context, 'done');
      } else {
        Navigator.pop(context, data['message'] as String? ?? 'Đăng nhập thất bại');
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      content: Row(
        children: [
          const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
          const SizedBox(width: 16),
          const Expanded(child: Text('Vui lòng đăng nhập Google trong trình duyệt...')),
        ],
      ),
    );
  }
}
