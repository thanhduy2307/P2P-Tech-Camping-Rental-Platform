import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:velox_mobile/models/asset.dart';
import 'package:velox_mobile/models/review.dart';
import 'package:velox_mobile/providers/auth_provider.dart';
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
  List<Review> _reviews = [];
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
      final data = await AssetService.getAssetDetail(id);
      _asset = data['asset'] as Asset;
      _reviews = (data['reviews'] as List).cast<Review>();
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
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
      UiHelper.showErrorToast(context, 'Chọn ngày bắt đầu và kết thúc.');
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
      UiHelper.showErrorToast(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
          appBar: AppBar(),
          body: const Center(child: CircularProgressIndicator()));
    }
    if (_asset == null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Không thể tải thông tin thiết bị'),
              const SizedBox(height: 12),
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('Quay lại')),
            ],
          ),
        ),
      );
    }
    final a = _asset!;
    final currentUser = context.read<AuthProvider>().user;
    final isOwner = a.lenderId != null && currentUser?.id == a.lenderId;
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
              .map((u) => AssetImageWidget(
                    image: u,
                    fit: BoxFit.cover,
                    placehold: const Center(child: CircularProgressIndicator()),
                    errWidget: const Icon(Icons.image, size: 60),
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
                        trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.person, color: Color(0xFF0058BE)),
                            onPressed: a.lenderId == null
                                ? null
                                : () => Navigator.pushNamed(context, '/user-profile',
                                    arguments: a.lenderId),
                          ),
                          IconButton(
                            icon: const Icon(Icons.chat, color: Color(0xFF0058BE)),
                            onPressed: a.lenderId == null
                                ? null
                                : () => Navigator.pushNamed(context, '/chat',
                                    arguments: {
                                      'peerId': a.lenderId,
                                      'peerName': a.lenderName
                                    }),
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (_reviews.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    const Text('Đánh giá',
                        style: TextStyle(fontWeight: FontWeight.bold, fontFamily: 'PlusJakartaSans', fontSize: 16)),
                    const SizedBox(height: 8),
                    ..._reviews.map((r) => _ReviewTile(review: r)),
                  ],
                  if (isOwner) ...[
                    const SizedBox(height: 16),
                    const Divider(),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => Navigator.pushNamed(context, '/lender/post-asset', arguments: a.id),
                        icon: const Icon(Icons.edit),
                        label: const Text('Chỉnh sửa thiết bị'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          foregroundColor: const Color(0xFF005236),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReviewTile extends StatelessWidget {
  final Review review;
  const _ReviewTile({required this.review});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: const Color(0xFF10B981),
              backgroundImage: review.renterAvatar != null
                  ? CachedNetworkImageProvider(review.renterAvatar!)
                  : null,
              child: review.renterAvatar == null
                  ? const Icon(Icons.person, size: 18, color: Color(0xFF005236))
                  : null,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(review.renterName,
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                      const Spacer(),
                      Row(
                        children: List.generate(5, (i) => Icon(
                          i < review.lenderRating ? Icons.star : Icons.star_border,
                          size: 16, color: const Color(0xFF0058BE),
                        )),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(review.lenderComment,
                      style: const TextStyle(color: Color(0xFF3C4A42), fontSize: 13)),
                  const SizedBox(height: 4),
                  Text(DateFormat('dd/MM/yyyy').format(review.createdAt),
                      style: const TextStyle(color: Color(0xFF808080), fontSize: 11)),
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
      content: const Text('Đơn hàng đã được tạo. Bạn sẽ được chuyển đến VNPay để thanh toán.'),
      actions: [
        TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text('Đóng')),
        ElevatedButton(
          onPressed: () {
            if (url != null && url!.startsWith('http')) {
              launchUrl(Uri.parse(url!), mode: LaunchMode.externalApplication);
            }
            Navigator.pop(context);
            Navigator.pop(context);
          },
          child: const Text('Mở VNPay'),
        ),
      ],
    );
  }
}
