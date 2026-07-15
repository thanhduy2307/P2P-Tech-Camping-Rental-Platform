import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:velox_mobile/models/asset.dart';
import 'package:velox_mobile/services/asset_service.dart';
import 'package:velox_mobile/services/order_service.dart';
import 'package:velox_mobile/widgets/common.dart';

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
      appBar: AppBar(title: Text(a.name)),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (a.images.isNotEmpty)
              SizedBox(
                height: 240,
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
                  Text(a.name,
                      style: const TextStyle(
                          fontSize: 22, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(a.category, style: const TextStyle(color: Colors.grey)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text(UiHelper.formatVnd(a.pricePerDay),
                          style: const TextStyle(
                              color: Colors.green,
                              fontWeight: FontWeight.bold,
                              fontSize: 18)),
                      const Text(' / ngày'),
                      const SizedBox(width: 16),
                      Text('Cọc: ${UiHelper.formatVnd(a.depositAmount)}'),
                    ],
                  ),
                  if (a.badges.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Wrap(
                        spacing: 6,
                        children: a.badges
                            .map((b) => Chip(
                                label: Text(b),
                                backgroundColor: Colors.blue[50]))
                            .toList(),
                      ),
                    ),
                  const SizedBox(height: 12),
                  const Text('Mô tả',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  Text(a.description),
                  const SizedBox(height: 16),
                  if (a.lenderName != null)
                    ListTile(
                      leading: const CircleAvatar(child: Icon(Icons.person)),
                      title: Text(a.lenderName!),
                      subtitle: const Text('Chủ thiết bị'),
                      trailing: IconButton(
                        icon: const Icon(Icons.chat),
                        onPressed: a.lenderId == null
                            ? null
                            : () => Navigator.pushNamed(context, '/chat',
                                arguments: {
                                  'peerId': a.lenderId,
                                  'peerName': a.lenderName
                                }),
                      ),
                    ),
                  const Divider(),
                  const Text('Đặt thuê',
                      style: TextStyle(
                          fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _start,
                    readOnly: true,
                    onTap: () => _pickDate(_start),
                    decoration:
                        const InputDecoration(labelText: 'Ngày bắt đầu'),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _end,
                    readOnly: true,
                    onTap: () => _pickDate(_end),
                    decoration:
                        const InputDecoration(labelText: 'Ngày kết thúc'),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _depositMethod,
                    items: const [
                      DropdownMenuItem(
                          value: 'online', child: Text('Cọc online (VNPay)')),
                      DropdownMenuItem(
                          value: 'cash', child: Text('Cọc tiền mặt')),
                    ],
                    onChanged: (v) => setState(() => _depositMethod = v!),
                    decoration:
                        const InputDecoration(labelText: 'Phương thức cọc'),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _book,
                      child: const Text('Đặt và thanh toán'),
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
