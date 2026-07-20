import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:velox_mobile/main.dart';
import 'package:velox_mobile/providers/auth_provider.dart';
import 'package:velox_mobile/widgets/common.dart';

class OtpScreen extends StatefulWidget {
  const OtpScreen({super.key});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _otp = TextEditingController();

  Future<void> _submit(String userId) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    try {
      await auth.verifyOtp(userId, _otp.text.trim());
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, AppRoutes.homeForRole(auth.role));
    } catch (e) {
      UiHelper.showError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)?.settings.arguments as Map?;
    final userId = args?['userId']?.toString() ?? '';
    final auth = Provider.of<AuthProvider>(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Xác thực OTP')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Text('Nhập mã OTP đã gửi đến số điện thoại của bạn.'),
            const SizedBox(height: 16),
            TextField(
              controller: _otp,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Mã OTP (6 số)'),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: auth.loading ? null : () => _submit(userId),
                child: auth.loading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Xác thực'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
