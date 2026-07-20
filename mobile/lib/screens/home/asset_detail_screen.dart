import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:velox_mobile/models/asset.dart';
import 'package:velox_mobile/services/asset_service.dart';
import 'package:velox_mobile/services/order_service.dart';
import 'package:velox_mobile/widgets/common.dart';
import 'package:velox_mobile/widgets/velox_button.dart';

class AssetDetailScreen extends StatefulWidget {
  const AssetDetailScreen({super.key});

  @override
  State<AssetDetailScreen> createState() => _AssetDetailScreenState();
}

class _AssetDetailScreenState extends State<AssetDetailScreen> {
  Asset? _asset;
  bool _loading = true;
  final _start = TextEditingController();
  final _end = TextEditingController();
  String _depositMethod = 'online';

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
      _asset = await AssetService.getAssetById(id);
    } catch (e) {
      if (mounted) UiHelper.showError(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickDate(TextEditingController c) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      c.text = DateFormat('yyyy-MM-dd').format(picked);
    }
  }

  Future<void> _book() async {
    if (_asset == null || _start.text.isEmpty || _end.text.isEmpty) {
      UiHelper.showError(context, 'Chọn ngày bắt đầu và kết thúc.');
      return;
    }
    try {
      final res = await OrderService.createOrder(
        assetId: _asset!.id,
        startDate: _start.text,
        endDate: _end.text,
        depositMethod: _depositMethod,
      );
      final url = res['paymentUrl'];
      if (!mounted) return;
      showDialog(
        context: context,
        builder: (_) => AlertRequestPayment(url: url),
      );
    } catch (e) {
      UiHelper.showError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
          appBar: AppBar(),
          body: const Center(child: CircularProgressIndicator()));
    }
    final a = _asset!;
    return Scaffold(
      appBar: AppBar(title: Text(a.name, style: const TextStyle(fontFamily: 'PlusJakartaSans', fontWeight: FontWeight.w800))),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (a.images.isNotEmpty)
              SizedBox(
                height: 260,
                child: PageView(
                  children: a.images
                      .map((u) => CachedNetworkImage(
                            imageUrl: u,
                            fit: BoxFit.cover,
                            placeholder: (_, __) =>
                                const Center(child: CircularProgressIndicator()),
                            errorWidget: (_, __, ___) =>
                                const Icon(Icons.image, size: 60),
                          ))
                      .toList(),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(a.category,
                        style: const TextStyle(color: Color(0xFF006C49), fontWeight: FontWeight.w600, fontSize: 12)),
                  ),
                  const SizedBox(height: 8),
                  Text(a.name,
                      style: const TextStyle(
                          fontSize: 22, fontWeight: FontWeight.bold, fontFamily: 'PlusJakartaSans')),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text(UiHelper.formatVnd(a.pricePerDay),
                          style: const TextStyle(
                              color: Color(0xFF006C49),
                              fontWeight: FontWeight.bold,
                              fontSize: 20)),
                      const Text(' / ngày', style: TextStyle(color: Color(0xFF3C4A42))),
                      const SizedBox(width: 16),
                      Text('Cọc: ${UiHelper.formatVnd(a.depositAmount)}',
                          style: const TextStyle(color: Color(0xFF3C4A42))),
                    ],
                  ),
                  if (a.badges.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: Wrap(
                        spacing: 6,
                        children: a.badges
                            .map((b) => Chip(
                                label: Text(b),
                                backgroundColor: const Color(0xFF10B981).withValues(alpha: 0.12),
                                labelStyle: const TextStyle(color: Color(0xFF006C49))))
                            .toList(),
                      ),
                    ),
                  const SizedBox(height: 14),
                  const Text('Mô tả',
                      style: TextStyle(fontWeight: FontWeight.bold, fontFamily: 'PlusJakartaSans')),
                  const SizedBox(height: 4),
                  Text(a.description, style: const TextStyle(color: Color(0xFF3C4A42))),
                  const SizedBox(height: 16),
                  if (a.lenderName != null)
                    Card(
                      child: ListTile(
                        leading: const CircleAvatar(
                            backgroundColor: Color(0xFF10B981),
                            child: Icon(Icons.person, color: Color(0xFF005236))),
                        title: Text(a.lenderName!, style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: const Text('Chủ thiết bị'),
                        trailing: IconButton(
                          icon: const Icon(Icons.chat, color: Color(0xFF0058BE)),
                          onPressed: a.lenderId == null
                              ? null
                              : () => Navigator.pushNamed(context, '/chat',
                                  arguments: {
                                    'peerId': a.lenderId,
                                    'peerName': a.lenderName
                                  }),
                        ),
                      ),
                    ),
                  const Divider(),
                  const Text('Đặt thuê',
                      style: TextStyle(
                          fontSize: 18, fontWeight: FontWeight.bold, fontFamily: 'PlusJakartaSans')),
                  const SizedBox(height: 8),
                  VeloxTextField(
                    label: 'Ngày bắt đầu',
                    hint: 'Chọn ngày',
                    controller: _start,
                    readOnly: true,
                    onTap: () => _pickDate(_start),
                    prefixIcon: const Icon(Icons.calendar_today_outlined),
                  ),
                  const SizedBox(height: 12),
                  VeloxTextField(
                    label: 'Ngày kết thúc',
                    hint: 'Chọn ngày',
                    controller: _end,
                    readOnly: true,
                    onTap: () => _pickDate(_end),
                    prefixIcon: const Icon(Icons.calendar_today_outlined),
                  ),
                  const SizedBox(height: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Phương thức cọc',
                          style: TextStyle(fontFamily: 'PlusJakartaSans', fontWeight: FontWeight.w600, fontSize: 14)),
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
                            value: _depositMethod,
                            items: const [
                              DropdownMenuItem(value: 'online', child: Text('Cọc online (VNPay)')),
                              DropdownMenuItem(value: 'cash', child: Text('Cọc tiền mặt')),
                            ],
                            onChanged: (v) => setState(() => _depositMethod = v!),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _book,
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: const Color(0xFF005236),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Đặt và thanh toán', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AlertRequestPayment extends StatelessWidget {
  final String? url;
  const AlertRequestPayment({super.key, this.url});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Thanh toán'),
      content: SingleChildScrollView(
        child: Text(
            'Đơn hàng đã được tạo. Vui lòng mở liên kết VNPay sau để thanh toán:\n\n${url ?? ''}'),
      ),
      actions: [
        TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text('Đóng')),
      ],
    );
  }
}
