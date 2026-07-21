import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:velox_mobile/core/theme.dart';
import 'package:velox_mobile/models/order.dart';
import 'package:velox_mobile/services/order_service.dart';
import 'package:velox_mobile/widgets/common.dart';
import 'package:velox_mobile/widgets/equip_dialog.dart';

class OrderDetailScreen extends StatefulWidget {
  const OrderDetailScreen({super.key});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  Order? _order;
  bool _loading = true;
  final _otp = TextEditingController();
  final _picker = ImagePicker();
  final List<XFile> _selectedImages = [];
  int _rating = 5;
  final _comment = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final id = ModalRoute.of(context)?.settings.arguments as String?;
      if (id != null) _load(id);
    });
  }

  Future<void> _load(String id) async {
    try {
      // Reuse my-rentals / incoming to locate the order detail.
      final rentals = await OrderService.getMyRentals();
      _order = rentals.firstWhere((o) => o.id == id,
          orElse: () => rentals.isNotEmpty ? rentals.first : Order(
              id: id,
              assetId: '',
              assetName: 'Đơn hàng',
              renterId: '',
              lenderId: '',
              startDate: '',
              endDate: '',
              rentalDays: 0,
              totalRent: 0,
              deposit: 0,
              status: ''));
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickImages() async {
    final picked = await _picker.pickMultiImage(imageQuality: 75, maxWidth: 1024);
    if (picked.isNotEmpty) setState(() => _selectedImages.addAll(picked));
  }

  void _removeImage(int index) {
    setState(() => _selectedImages.removeAt(index));
  }

  Future<void> _confirmHandover() async {
    if (_order == null) return;
    if (_selectedImages.length < 3) {
      UiHelper.showErrorToast(context, 'Vui lòng chọn ít nhất 3 ảnh bàn giao');
      return;
    }
    final confirmed = await EquipDialog.confirm(context, 'Xác nhận bàn giao', 'Xác nhận đã bàn giao thiết bị cho người thuê?');
    if (confirmed != true) return;
    UiHelper.showLoading(context);
    try {
      final imagesB64 = <String>[];
      for (final img in _selectedImages) {
        final bytes = await img.readAsBytes();
        final ext = img.path.split('.').last.toLowerCase();
        final mime = ext == 'png' ? 'image/png' : 'image/jpeg';
        imagesB64.add('data:$mime;base64,${base64Encode(bytes)}');
      }
      await OrderService.confirmHandover(_order!.id, _otp.text.trim(), imagesB64);
      if (!context.mounted) return;
      UiHelper.hideLoading(context);
      EquipDialog.success(context, 'Đã xác nhận bàn giao.');
      _load(_order!.id);
    } catch (e) {
      if (context.mounted) UiHelper.hideLoading(context);
      UiHelper.showErrorToast(context, e);
    }
  }

  Future<void> _rate() async {
    if (_order == null) return;
    try {
      await OrderService.submitRating(_order!.id, _rating, _comment.text);
      if (!mounted) return;
      EquipDialog.success(context, 'Đã đánh giá.');
    } catch (e) {
      UiHelper.showErrorToast(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
          appBar: AppBar(), body: const Center(child: CircularProgressIndicator()));
    }
    final o = _order!;
    return Scaffold(
      appBar: AppBar(title: Text('Đơn #${o.id.substring(0, 6)}')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(o.assetName,
                      style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.onSurface)),
                  const SizedBox(height: 12),
                  _infoRow(Icons.assignment, 'Trạng thái: ${o.status}'),
                  const SizedBox(height: 6),
                  _infoRow(Icons.date_range,
                      '${o.startDate} → ${o.endDate} (${o.rentalDays} ngày)'),
                  const SizedBox(height: 6),
                  _infoRow(Icons.monetization_on, 'Tiền thuê: ${UiHelper.formatVnd(o.totalRent)}'),
                  const SizedBox(height: 6),
                  _infoRow(Icons.lock, 'Tiền cọc: ${UiHelper.formatVnd(o.deposit)}'),
                  if (o.handoverOTP != null) ...[
                    const SizedBox(height: 6),
                    _infoRow(Icons.vpn_key, 'OTP bàn giao: ${o.handoverOTP}'),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Xác nhận bàn giao (Lender)',
                      style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: AppTheme.primary)),
                  const SizedBox(height: 12),
                  TextField(
                      controller: _otp,
                      decoration: const InputDecoration(
                          labelText: 'Mã OTP',
                          prefixIcon: Icon(Icons.pin))),
                  const SizedBox(height: 8),
                  if (_selectedImages.isNotEmpty)
                    SizedBox(
                      height: 80,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _selectedImages.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (ctx, i) => Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.file(File(_selectedImages[i].path),
                                  width: 80, height: 80, fit: BoxFit.cover),
                            ),
                            Positioned(
                              right: 0, top: 0,
                              child: GestureDetector(
                                onTap: () => _removeImage(i),
                                child: Container(
                                  decoration: const BoxDecoration(
                                    color: Colors.black54, shape: BoxShape.circle),
                                  padding: const EdgeInsets.all(2),
                                  child: const Icon(Icons.close, size: 14, color: Colors.white),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    onPressed: _pickImages,
                    icon: const Icon(Icons.photo_library_outlined, size: 20),
                    label: Text('Chọn ảnh bàn giao (${_selectedImages.length}/3)'),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                        onPressed: _confirmHandover,
                        child: const Text('Xác nhận bàn giao')),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Đánh giá',
                      style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: AppTheme.primary)),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                        5,
                        (i) => IconButton(
                            onPressed: () => setState(() => _rating = i + 1),
                            icon: Icon(i < _rating
                                ? Icons.star
                                : Icons.star_border,
                                color: i < _rating
                                    ? AppTheme.secondary
                                    : AppTheme.outline))),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                      controller: _comment,
                      decoration: const InputDecoration(
                          labelText: 'Nhận xét',
                          prefixIcon: Icon(Icons.comment))),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                        onPressed: _rate,
                        child: const Text('Gửi đánh giá')),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.onSurfaceVariant),
        const SizedBox(width: 8),
        Expanded(
          child: Text(text,
              style: const TextStyle(
                  fontSize: 14, color: AppTheme.onSurface)),
        ),
      ],
    );
  }
}
