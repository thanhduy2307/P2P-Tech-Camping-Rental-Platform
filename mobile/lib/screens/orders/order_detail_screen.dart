import 'package:flutter/material.dart';
import 'package:velox_mobile/models/order.dart';
import 'package:velox_mobile/services/order_service.dart';
import 'package:velox_mobile/widgets/common.dart';

class OrderDetailScreen extends StatefulWidget {
  const OrderDetailScreen({super.key});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  Order? _order;
  bool _loading = true;
  final _otp = TextEditingController();
  final _images = TextEditingController();
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
      if (mounted) UiHelper.showError(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _confirmHandover() async {
    if (_order == null) return;
    try {
      await OrderService.confirmHandover(
          _order!.id, _otp.text.trim(), _images.text.split(',').map((e) => e.trim()).toList());
      if (!mounted) return;
      UiHelper.showSuccess(context, 'Đã xác nhận bàn giao.');
      _load(_order!.id);
    } catch (e) {
      UiHelper.showError(context, e);
    }
  }

  Future<void> _rate() async {
    if (_order == null) return;
    try {
      await OrderService.submitRating(_order!.id, _rating, _comment.text);
      if (!mounted) return;
      UiHelper.showSuccess(context, 'Đã đánh giá.');
    } catch (e) {
      UiHelper.showError(context, e);
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
            Text(o.assetName,
                style:
                    const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Trạng thái: ${o.status}'),
            Text('Thời gian: ${o.startDate} → ${o.endDate} (${o.rentalDays} ngày)'),
            Text('Tiền thuê: ${UiHelper.formatVnd(o.totalRent)}'),
            Text('Tiền cọc: ${UiHelper.formatVnd(o.deposit)}'),
            if (o.handoverOTP != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text('OTP bàn giao: ${o.handoverOTP}',
                    style: const TextStyle(color: Colors.blue)),
              ),
            const Divider(height: 24),
            const Text('Xác nhận bàn giao (Lender)',
                style: TextStyle(fontWeight: FontWeight.bold)),
            TextField(
                controller: _otp,
                decoration: const InputDecoration(labelText: 'Mã OTP')),
            TextField(
                controller: _images,
                decoration: const InputDecoration(
                    labelText: 'URL ảnh (cách nhau bởi dấu phẩy)',
                    hintText: 'https://.../1.jpg, https://.../2.jpg')),
            const SizedBox(height: 8),
            ElevatedButton(
                onPressed: _confirmHandover,
                child: const Text('Xác nhận bàn giao')),
            const Divider(height: 24),
            const Text('Đánh giá',
                style: TextStyle(fontWeight: FontWeight.bold)),
            Row(
              children: List.generate(
                  5,
                  (i) => IconButton(
                      onPressed: () => setState(() => _rating = i + 1),
                      icon: Icon(i < _rating
                          ? Icons.star
                          : Icons.star_border))),
            ),
            TextField(
                controller: _comment,
                decoration:
                    const InputDecoration(labelText: 'Nhận xét')),
            ElevatedButton(onPressed: _rate, child: const Text('Gửi đánh giá')),
          ],
        ),
      ),
    );
  }
}
