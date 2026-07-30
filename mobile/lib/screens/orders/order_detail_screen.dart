import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:velox_mobile/core/storage.dart';
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
  final List<XFile> _images = [];
  int _rating = 5;
  final _comment = TextEditingController();
  final _cancelReason = TextEditingController();
  final _disputeNotes = TextEditingController();
  String _disputeType = 'renter';
  final _extendDays = TextEditingController();

  bool get _isLender => Storage.getRole() == 'lender';

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
      final data = await OrderService.getMyRentals();
      Order? found = data.cast<Order?>().firstWhere((o) => o!.id == id, orElse: () => null);
      if (found == null && _isLender) {
        final incoming = await OrderService.getIncoming();
        found = incoming.cast<Order?>().firstWhere((o) => o!.id == id, orElse: () => null);
      }
      setState(() => _order = found);
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _reload() async {
    setState(() => _loading = true);
    if (_order?.id != null) await _load(_order!.id);
  }

  Future<void> _pickImages() async {
    final picked = await _picker.pickMultiImage(imageQuality: 75, maxWidth: 1024);
    if (picked.isNotEmpty) setState(() => _images.addAll(picked));
  }

  void _removeImage(int index) => setState(() => _images.removeAt(index));

  Future<List<String>> _encodeImages() async => UiHelper.imagesToBase64(_images);

  Future<void> _confirmHandover() async {
    if (_order == null) return;
    if (_images.length < 3) {
      UiHelper.showErrorToast(context, 'Chọn ít nhất 3 ảnh bàn giao');
      return;
    }
    final ok = await EquipDialog.confirm(context, 'Xác nhận bàn giao', 'Xác nhận đã bàn giao thiết bị?');
    if (ok != true) return;
    UiHelper.showLoading(context);
    try {
      await OrderService.confirmHandover(_order!.id, _otp.text.trim(), await _encodeImages());
      if (!mounted) return;
      UiHelper.hideLoading(context);
      EquipDialog.success(context, 'Đã bàn giao thành công');
      _reload();
    } catch (e) {
      if (mounted) UiHelper.hideLoading(context);
      UiHelper.showErrorToast(context, e);
    }
  }

  Future<void> _confirmReturn() async {
    if (_order == null) return;
    if (_images.length < 3) {
      UiHelper.showErrorToast(context, 'Chọn ít nhất 3 ảnh trả hàng');
      return;
    }
    final ok = await EquipDialog.confirm(context, 'Xác nhận trả hàng', 'Xác nhận đã nhận lại thiết bị?');
    if (ok != true) return;
    UiHelper.showLoading(context);
    try {
      await OrderService.confirmReturn(_order!.id, _otp.text.trim(), await _encodeImages());
      if (!mounted) return;
      UiHelper.hideLoading(context);
      EquipDialog.success(context, 'Đã trả hàng thành công');
      _reload();
    } catch (e) {
      if (mounted) UiHelper.hideLoading(context);
      UiHelper.showErrorToast(context, e);
    }
  }

  Future<void> _cancelOrder() async {
    final ok = await EquipDialog.confirm(context, 'Hủy đơn', 'Bạn có chắc muốn hủy đơn này?');
    if (ok != true) return;
    UiHelper.showLoading(context);
    try {
      await OrderService.cancelOrder(_order!.id, reason: _cancelReason.text.isEmpty ? null : _cancelReason.text);
      if (!mounted) return;
      UiHelper.hideLoading(context);
      EquipDialog.success(context, 'Đã hủy đơn');
      _reload();
    } catch (e) {
      if (mounted) UiHelper.hideLoading(context);
      UiHelper.showErrorToast(context, e);
    }
  }

  Future<void> _raiseDispute() async {
    final ok = await EquipDialog.confirm(context, 'Gửi khiếu nại', 'Gửi khiếu nại cho đơn này?');
    if (ok != true) return;
    UiHelper.showLoading(context);
    try {
      await OrderService.raiseDispute(_order!.id, notes: _disputeNotes.text, disputeType: _disputeType);
      if (!mounted) return;
      UiHelper.hideLoading(context);
      EquipDialog.success(context, 'Đã gửi khiếu nại');
      _reload();
    } catch (e) {
      if (mounted) UiHelper.hideLoading(context);
      UiHelper.showErrorToast(context, e);
    }
  }

  Future<void> _requestExtension() async {
    final days = int.tryParse(_extendDays.text);
    if (days == null || days < 1) {
      UiHelper.showErrorToast(context, 'Nhập số ngày gia hạn');
      return;
    }
    final ok = await EquipDialog.confirm(context, 'Gia hạn', 'Gửi yêu cầu gia hạn $days ngày?');
    if (ok != true) return;
    UiHelper.showLoading(context);
    try {
      await OrderService.requestExtension(_order!.id, days);
      if (!mounted) return;
      UiHelper.hideLoading(context);
      EquipDialog.success(context, 'Đã gửi yêu cầu gia hạn');
      _reload();
    } catch (e) {
      if (mounted) UiHelper.hideLoading(context);
      UiHelper.showErrorToast(context, e);
    }
  }

  Future<void> _approveExtension() async {
    final ok = await EquipDialog.confirm(context, 'Duyệt gia hạn', 'Chấp nhận yêu cầu gia hạn?');
    if (ok != true) return;
    UiHelper.showLoading(context);
    try {
      await OrderService.approveExtension(_order!.id);
      if (!mounted) return;
      UiHelper.hideLoading(context);
      EquipDialog.success(context, 'Đã duyệt gia hạn');
      _reload();
    } catch (e) {
      if (mounted) UiHelper.hideLoading(context);
      UiHelper.showErrorToast(context, e);
    }
  }

  Future<void> _openPayment() async {
    final uri = _order?.handoverOTP; // reuse field to store paymentUrl temporarily
    if (uri != null && uri.startsWith('http')) {
      await launchUrl(Uri.parse(uri), mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _rate() async {
    if (_order == null) return;
    try {
      await OrderService.submitRating(_order!.id, _rating, _comment.text);
      if (!mounted) return;
      EquipDialog.success(context, 'Đã đánh giá');
      _reload();
    } catch (e) {
      UiHelper.showErrorToast(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return Scaffold(appBar: AppBar(), body: const Center(child: CircularProgressIndicator()));
    if (_order == null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Không thể tải đơn hàng'),
              const SizedBox(height: 12),
              TextButton(onPressed: _reload, child: const Text('Thử lại')),
            ],
          ),
        ),
      );
    }
    final o = _order!;
    final s = o.status;
    final canCancel = s == 'pending_payment' || s == 'reserved';
    final canHandover = s == 'reserved' || s == 'active';
    final canReturn = s == 'active';
    final canRate = s == 'returned' || s == 'completed';
    final canDispute = s == 'active' || s == 'returned';
    final canExtend = s == 'active';
    final showPayment = s == 'pending_payment' && o.handoverOTP != null && o.handoverOTP!.startsWith('http');

    return Scaffold(
      appBar: AppBar(title: Text('Đơn #${o.id.substring(0, 6)}'), actions: [
        IconButton(icon: const Icon(Icons.refresh), onPressed: _reload),
      ]),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        _card([
          Text(o.assetName, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          _row(Icons.assignment, 'Trạng thái: ${_statusText(s)}'),
          _row(Icons.date_range, '${_fmt(o.startDate)} → ${_fmt(o.endDate)} (${o.rentalDays} ngày)'),
          _row(Icons.person, 'Người thuê: ${o.renterName ?? (o.renterId.length >= 6 ? o.renterId.substring(0, 6) : o.renterId)}'),
          _row(Icons.person_outline, 'Chủ: ${o.lenderName ?? (o.lenderId.length >= 6 ? o.lenderId.substring(0, 6) : o.lenderId)}'),
          _row(Icons.monetization_on, 'Tiền thuê: ${UiHelper.formatVnd(o.totalRent)}'),
          _row(Icons.lock, 'Tiền cọc: ${UiHelper.formatVnd(o.deposit)}'),
          if (o.platformFee > 0) _row(Icons.receipt, 'Phí nền tảng: ${UiHelper.formatVnd(o.platformFee)}'),
          if (o.lateDays != null && o.lateFee != null && o.lateFee! > 0)
            _row(Icons.warning, 'Trễ $o.lateDays ngày, phí: ${UiHelper.formatVnd(o.lateFee!)}', warn: true),
          if (o.handoverOTP != null && o.handoverOTP!.length == 6)
            _row(Icons.vpn_key, 'OTP bàn giao: ${o.handoverOTP}'),
          if (o.returnOTP != null && o.returnOTP!.length == 6)
            _row(Icons.vpn_key, 'OTP trả hàng: ${o.returnOTP}'),
        ]),

        // --- Payment ---
        if (showPayment) ...[
          const SizedBox(height: 12),
          _card([
            const Text('Thanh toán', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            SizedBox(width: double.infinity, child: ElevatedButton.icon(
              onPressed: _openPayment,
              icon: const Icon(Icons.open_in_browser),
              label: const Text('Mở VNPay thanh toán'),
            )),
          ]),
        ],

        // --- Handover ---
        if (canHandover && _isLender) ...[
          const SizedBox(height: 12),
          _card([
            const Text('Bàn giao', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.primary)),
            const SizedBox(height: 8),
            TextField(controller: _otp, decoration: const InputDecoration(labelText: 'Mã OTP', prefixIcon: Icon(Icons.pin))),
            const SizedBox(height: 8),
            _imageGrid(),
            OutlinedButton.icon(onPressed: _pickImages, icon: const Icon(Icons.photo_library), label: Text('Chọn ảnh (${_images.length}/3)')),
            const SizedBox(height: 8),
            SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _confirmHandover, child: const Text('Xác nhận bàn giao'))),
          ]),
        ],

        // --- Return ---
        if (canReturn && _isLender) ...[
          const SizedBox(height: 12),
          _card([
            const Text('Trả hàng', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.secondary)),
            const SizedBox(height: 8),
            TextField(controller: _otp, decoration: const InputDecoration(labelText: 'Mã OTP trả hàng', prefixIcon: Icon(Icons.pin))),
            const SizedBox(height: 8),
            _imageGrid(),
            OutlinedButton.icon(onPressed: _pickImages, icon: const Icon(Icons.photo_library), label: Text('Chọn ảnh (${_images.length}/3)')),
            const SizedBox(height: 8),
            SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _confirmReturn, child: const Text('Xác nhận trả hàng'))),
          ]),
        ],

        // --- Extension ---
        if (canExtend) ...[
          const SizedBox(height: 12),
          _card([
            const Text('Gia hạn', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            if (o.extensionStatus == 'pending')
              Text('Đang chờ ${_isLender ? 'người thuê' : 'chủ'} duyệt gia hạn ${o.extensionDays} ngày')
            else ...[
              TextField(controller: _extendDays, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Số ngày gia hạn', prefixIcon: Icon(Icons.date_range))),
              const SizedBox(height: 8),
              SizedBox(width: double.infinity, child: ElevatedButton(
                onPressed: _requestExtension,
                child: const Text('Gửi yêu cầu gia hạn'),
              )),
            ],
          ]),
        ],

        // --- Cancel ---
        if (canCancel) ...[
          const SizedBox(height: 12),
          _card([
            const Text('Hủy đơn', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.error)),
            const SizedBox(height: 8),
            TextField(controller: _cancelReason, decoration: const InputDecoration(labelText: 'Lý do (không bắt buộc)', prefixIcon: Icon(Icons.edit))),
            const SizedBox(height: 8),
            SizedBox(width: double.infinity, child: OutlinedButton(
              style: OutlinedButton.styleFrom(foregroundColor: AppTheme.error),
              onPressed: _cancelOrder,
              child: const Text('Hủy đơn'),
            )),
          ]),
        ],

        // --- Dispute ---
        if (canDispute) ...[
          const SizedBox(height: 12),
          _card([
            const Text('Khiếu nại', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.orange)),
            const SizedBox(height: 8),
            if (o.disputeStatus == 'pending')
              Text('Đang xử lý khiếu nại của bạn')
            else if (o.disputeStatus == 'resolved')
              Text('Khiếu nại đã được giải quyết')
            else ...[
              DropdownButtonFormField<String>(
                value: _disputeType,
                items: const [DropdownMenuItem(value: 'renter', child: Text('Tôi là người thuê')), DropdownMenuItem(value: 'lender', child: Text('Tôi là chủ'))],
                onChanged: (v) => setState(() => _disputeType = v!),
                decoration: const InputDecoration(labelText: 'Vai trò', prefixIcon: Icon(Icons.people)),
              ),
              const SizedBox(height: 8),
              TextField(controller: _disputeNotes, maxLines: 2, decoration: const InputDecoration(labelText: 'Nội dung khiếu nại', prefixIcon: Icon(Icons.description))),
              const SizedBox(height: 8),
              SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _raiseDispute, child: const Text('Gửi khiếu nại'))),
            ],
          ]),
        ],

        // --- Rating ---
        if (canRate) ...[
          const SizedBox(height: 12),
          _card([
            const Text('Đánh giá', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            if (o.renterRating != null && !_isLender)
              Text('Bạn đã đánh giá: ${'⭐' * o.renterRating!}')
            else if (o.lenderRating != null && _isLender)
              Text('Bạn đã đánh giá: ${'⭐' * o.lenderRating!}')
            else ...[
              Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(5, (i) => IconButton(
                onPressed: () => setState(() => _rating = i + 1),
                icon: Icon(i < _rating ? Icons.star : Icons.star_border, color: i < _rating ? AppTheme.secondary : AppTheme.outline),
              ))),
              TextField(controller: _comment, decoration: const InputDecoration(labelText: 'Nhận xét', prefixIcon: Icon(Icons.comment))),
              const SizedBox(height: 8),
              SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _rate, child: const Text('Gửi đánh giá'))),
            ],
          ]),
        ],
      ]),
    );
  }

  Widget _card(List<Widget> children) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16),
      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 12, offset: const Offset(0, 4))]),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
  );

  Widget _row(IconData icon, String text, {bool warn = false}) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 2),
    child: Row(children: [
      Icon(icon, size: 18, color: warn ? Colors.orange : AppTheme.onSurfaceVariant),
      const SizedBox(width: 8),
      Expanded(child: Text(text, style: TextStyle(fontSize: 14, color: warn ? Colors.orange : AppTheme.onSurface))),
    ]),
  );

  Widget _imageGrid() {
    if (_images.isEmpty) return const SizedBox.shrink();
    return SizedBox(
      height: 80,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _images.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (ctx, i) => Stack(children: [
          ClipRRect(borderRadius: BorderRadius.circular(8), child: Image.file(File(_images[i].path), width: 80, height: 80, fit: BoxFit.cover)),
          Positioned(right: 0, top: 0, child: GestureDetector(
            onTap: () => _removeImage(i),
            child: Container(decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle), padding: const EdgeInsets.all(2),
              child: const Icon(Icons.close, size: 14, color: Colors.white)),
          )),
        ]),
      ),
    );
  }

  String _statusText(String s) {
    switch (s) {
      case 'pending_payment': return 'Chờ thanh toán';
      case 'reserved': return 'Đã đặt cọc';
      case 'active': return 'Đang thuê';
      case 'returned': return 'Đã trả';
      case 'completed': return 'Hoàn tất';
      case 'disputed': return 'Đang khiếu nại';
      case 'cancelled': return 'Đã hủy';
      default: return s;
    }
  }

  String _fmt(String d) {
    try { return DateFormat('dd/MM/yyyy').format(DateTime.parse(d)); } catch (_) { return d; }
  }
}
