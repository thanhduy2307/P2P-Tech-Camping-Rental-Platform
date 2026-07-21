import 'package:flutter/material.dart';
import 'package:velox_mobile/services/auth_service.dart';
import 'package:velox_mobile/widgets/common.dart';

class RenterEkycScreen extends StatefulWidget {
  const RenterEkycScreen({super.key});

  @override
  State<RenterEkycScreen> createState() => _RenterEkycScreenState();
}

class _RenterEkycScreenState extends State<RenterEkycScreen> {
  final _front = TextEditingController();
  final _back = TextEditingController();
  final _selfie = TextEditingController();
  bool _loading = false;

  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      await AuthService.applyRenterEkyc(
        cccdFront: _front.text.trim(),
        cccdBack: _back.text.trim(),
        cccdSelfie: _selfie.text.trim(),
      );
      if (!mounted) return;
      UiHelper.showSuccessToast(context, 'Đã gửi hồ sơ eKYC. Chờ Admin duyệt.');
      Navigator.pop(context);
    } catch (e) {
      UiHelper.showErrorToast(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Xác thực CCCD (Renter)')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: SingleChildScrollView(
          child: Column(
            children: [
              _urlField(_front, 'Ảnh CCCD mặt trước (URL)'),
              _urlField(_back, 'Ảnh CCCD mặt sau (URL)'),
              _urlField(_selfie, 'Ảnh selfie với CCCD (URL)'),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  child: _loading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Gửi hồ sơ'),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Mẹo: tích hợp image_picker để chụp trực tiếp thay vì dán URL.',
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _urlField(TextEditingController c, String label) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: TextField(
            controller: c, decoration: InputDecoration(labelText: label)),
      );
}
