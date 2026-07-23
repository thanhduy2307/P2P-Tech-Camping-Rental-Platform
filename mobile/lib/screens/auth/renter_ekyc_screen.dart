import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:velox_mobile/core/theme.dart';
import 'package:velox_mobile/services/auth_service.dart';
import 'package:velox_mobile/widgets/common.dart';
import 'package:velox_mobile/widgets/equip_dialog.dart';

class RenterEkycScreen extends StatefulWidget {
  const RenterEkycScreen({super.key});

  @override
  State<RenterEkycScreen> createState() => _RenterEkycScreenState();
}

class _RenterEkycScreenState extends State<RenterEkycScreen> {
  final _picker = ImagePicker();
  XFile? _front;
  XFile? _back;
  XFile? _selfie;
  bool _loading = false;

  Future<XFile?> _pickOne() async {
    return await _picker.pickImage(source: ImageSource.gallery, imageQuality: 75, maxWidth: 1024);
  }

  Future<String> _toBase64(XFile file) async {
    final bytes = await file.readAsBytes();
    final ext = file.path.split('.').last.toLowerCase();
    final mime = ext == 'png' ? 'image/png' : 'image/jpeg';
    return 'data:$mime;base64,${base64Encode(bytes)}';
  }

  Future<void> _submit() async {
    if (_front == null || _back == null || _selfie == null) {
      UiHelper.showErrorToast(context, 'Vui lòng chọn đủ 3 ảnh CCCD');
      return;
    }
    setState(() => _loading = true);
    try {
      await AuthService.applyRenterEkyc(
        cccdFront: await _toBase64(_front!),
        cccdBack: await _toBase64(_back!),
        cccdSelfie: await _toBase64(_selfie!),
      );
      if (!mounted) return;
      EquipDialog.success(context, 'Đã gửi hồ sơ eKYC. Chờ Admin duyệt.');
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
              _imagePicker('Ảnh CCCD mặt trước', Icons.credit_card_rounded, _front, (f) => setState(() => _front = f)),
              const SizedBox(height: 12),
              _imagePicker('Ảnh CCCD mặt sau', Icons.credit_card_rounded, _back, (f) => setState(() => _back = f)),
              const SizedBox(height: 12),
              _imagePicker('Ảnh selfie với CCCD', Icons.face_outlined, _selfie, (f) => setState(() => _selfie = f)),
              if (_front != null && _back != null && _selfie != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text('✓ Đã chọn đủ 3 ảnh', style: TextStyle(color: AppTheme.primaryContainer, fontWeight: FontWeight.w600)),
                ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  child: _loading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Gửi hồ sơ'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _imagePicker(String label, IconData icon, XFile? file, ValueChanged<XFile?> onPicked) {
    return InkWell(
      onTap: () async {
        final picked = await _pickOne();
        if (picked != null) onPicked(picked);
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: file != null ? AppTheme.primaryContainer : AppTheme.outline.withValues(alpha: 0.5),
            width: file != null ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: file != null
                  ? Image.file(File(file.path), width: 64, height: 64, fit: BoxFit.cover)
                  : Container(
                      width: 64,
                      height: 64,
                      color: AppTheme.surface,
                      child: Icon(icon, color: AppTheme.onSurfaceVariant, size: 28),
                    ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 2),
                  Text(
                    file != null ? '✓ Đã chọn' : 'Nhấn để chọn ảnh từ thư viện',
                    style: TextStyle(fontSize: 12, color: file != null ? AppTheme.primaryContainer : AppTheme.onSurfaceVariant),
                  ),
                ],
              ),
            ),
            if (file != null)
              GestureDetector(
                onTap: () => onPicked(null),
                child: const Icon(Icons.close, size: 20, color: AppTheme.error),
              ),
          ],
        ),
      ),
    );
  }
}
