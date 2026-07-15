import 'package:flutter/material.dart';
import 'package:velox_mobile/services/auth_service.dart';
import 'package:velox_mobile/widgets/common.dart';

class LenderOnboardingScreen extends StatefulWidget {
  const LenderOnboardingScreen({super.key});

  @override
  State<LenderOnboardingScreen> createState() =>
      _LenderOnboardingScreenState();
}

class _LenderOnboardingScreenState extends State<LenderOnboardingScreen> {
  final _front = TextEditingController();
  final _back = TextEditingController();
  final _selfie = TextEditingController();
  final _accNumber = TextEditingController();
  final _bankName = TextEditingController();
  final _accHolder = TextEditingController();
  bool _loading = false;

  Future<void> _submit() async {
    if (_accNumber.text.isEmpty ||
        _bankName.text.isEmpty ||
        _accHolder.text.isEmpty) {
      UiHelper.showError(context, 'Vui lòng điền đầy đủ thông tin ngân hàng.');
      return;
    }
    setState(() => _loading = true);
    try {
      await AuthService.applyLender(
        cccdFront: _front.text.trim(),
        cccdBack: _back.text.trim(),
        cccdSelfie: _selfie.text.trim(),
        bankAccount: {
          'accountNumber': _accNumber.text.trim(),
          'bankName': _bankName.text.trim(),
          'accountHolder': _accHolder.text.trim(),
        },
      );
      if (!mounted) return;
      UiHelper.showSuccess(context, 'Đã gửi hồ sơ Lender. Chờ Admin duyệt.');
      Navigator.pop(context);
    } catch (e) {
      UiHelper.showError(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Đăng ký Người cho thuê')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('1. Ảnh CCCD & xác thực',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              _f(_front, 'CCCD mặt trước (URL)'),
              _f(_back, 'CCCD mặt sau (URL)'),
              _f(_selfie, 'Selfie với CCCD (URL)'),
              const SizedBox(height: 12),
              const Text('2. Tài khoản ngân hàng nhận tiền',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              _f(_accNumber, 'Số tài khoản'),
              _f(_bankName, 'Tên ngân hàng (vd: Vietcombank)'),
              _f(_accHolder, 'Chủ tài khoản'),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  child: _loading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Gửi hồ sơ eKYC Lender'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _f(TextEditingController c, String label) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: TextField(
            controller: c, decoration: InputDecoration(labelText: label)),
      );
}
