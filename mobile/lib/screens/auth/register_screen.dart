import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:velox_mobile/providers/auth_provider.dart';
import 'package:velox_mobile/widgets/common.dart';
import 'package:velox_mobile/widgets/brand_logo.dart';
import 'package:velox_mobile/widgets/velox_button.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;
  String _role = 'renter';

  Future<void> _submit() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    try {
      final data = await auth.registerPhone(
          _name.text.trim(), _phone.text.trim(), _password.text, _role);
      if (!mounted) return;
      Navigator.pushNamed(context, '/otp',
          arguments: {'userId': data['userId'], 'phone': _phone.text.trim()});
    } catch (e) {
      UiHelper.showError(context, e);
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
                  BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 24, offset: const Offset(0, 8)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Center(child: BrandLogo(size: 30)),
                  const SizedBox(height: 20),
                  const Text(
                    'Tạo tài khoản',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontFamily: 'PlusJakartaSans', fontWeight: FontWeight.w800, fontSize: 24),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Tham gia EquipPeer để bắt đầu cho thuê hoặc thuê đồ',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 14, color: Color(0xFF3C4A42)),
                  ),
                  const SizedBox(height: 24),
                  VeloxTextField(
                    label: 'Họ tên',
                    hint: 'Nguyễn Văn A',
                    controller: _name,
                    prefixIcon: const Icon(Icons.person_outline),
                  ),
                  const SizedBox(height: 16),
                  VeloxTextField(
                    label: 'Số điện thoại',
                    hint: '09xxxxxxxx',
                    controller: _phone,
                    keyboardType: TextInputType.phone,
                    prefixIcon: const Icon(Icons.phone_outlined),
                  ),
                  const SizedBox(height: 16),
                  VeloxTextField(
                    label: 'Mật khẩu',
                    hint: '••••••••',
                    controller: _password,
                    obscureText: _obscure,
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Bạn là', style: TextStyle(fontFamily: 'PlusJakartaSans', fontWeight: FontWeight.w600, fontSize: 14)),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F4F2),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFBBCABF)),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            isExpanded: true,
                            value: _role,
                            items: const [
                              DropdownMenuItem(value: 'renter', child: Text('Người thuê')),
                              DropdownMenuItem(value: 'lender', child: Text('Người cho thuê')),
                            ],
                            onChanged: (v) => setState(() => _role = v!),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  VeloxButton(
                    label: 'Tiếp tục',
                    loading: auth.loading,
                    onPressed: auth.loading ? null : _submit,
                    icon: const Icon(Icons.arrow_forward, size: 18),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Đã có tài khoản? ', style: TextStyle(fontSize: 14)),
                      GestureDetector(
                        onTap: () => Navigator.pushReplacementNamed(context, '/login'),
                        child: const Text('Đăng nhập', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF0058BE))),
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
