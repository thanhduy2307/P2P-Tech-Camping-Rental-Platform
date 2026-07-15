import 'package:flutter/material.dart';
import 'package:velox_mobile/models/asset.dart';
import 'package:velox_mobile/services/asset_service.dart';
import 'package:velox_mobile/widgets/asset_card.dart';
import 'package:velox_mobile/widgets/common.dart';
import 'package:velox_mobile/screens/home/asset_detail_screen.dart';
import 'package:velox_mobile/screens/orders/my_orders_screen.dart';
import 'package:velox_mobile/screens/chat/conversations_screen.dart';
import 'package:velox_mobile/screens/profile/profile_screen.dart';

class BrowseScreen extends StatelessWidget {
  const BrowseScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Khám phá thiết bị'),
        actions: [
          IconButton(
            icon: const Icon(Icons.auto_awesome),
            tooltip: 'AI gợi ý theo nhu cầu',
            onPressed: () => _showAiRecommend(context),
          ),
        ],
      ),
      body: const _AssetList(),
      bottomNavigationBar: _HomeNavBar(current: 0),
    );
  }

  void _showAiRecommend(BuildContext context) {
    final ctrl = TextEditingController();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('AI tư vấn cắm trại'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Mô tả chuyến đi (vd: cắm trại 4 người 2 ngày, ngân sách 500k)'),
            const SizedBox(height: 8),
            TextField(
              controller: ctrl,
              maxLines: 2,
              decoration:
                  const InputDecoration(hintText: 'Nhu cầu của bạn...'),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Hủy')),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                final data = await AssetService.recommend(ctrl.text);
                if (!context.mounted) return;
                showDialog(
                  context: context,
                  builder: (_) => AlertDialog(
                    title: const Text('Gợi ý từ AI'),
                    content: SingleChildScrollView(
                      child: Text(data['recommendations']?.toString() ??
                          'Không có gợi ý.'),
                    ),
                    actions: [
                      TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('Đóng')),
                    ],
                  ),
                );
              } catch (e) {
                UiHelper.showError(context, e);
              }
            },
            child: const Text('Gợi ý'),
          ),
        ],
      ),
    );
  }
}

class _AssetList extends StatefulWidget {
  const _AssetList();

  @override
  State<_AssetList> createState() => _AssetListState();
}

class _AssetListState extends State<_AssetList> {
  List<Asset> _assets = [];
  bool _loading = true;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _assets = await AssetService.getVerifiedAssets();
    } catch (e) {
      if (mounted) UiHelper.showError(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _assets
        .where((a) =>
            a.name.toLowerCase().contains(_query.toLowerCase()) ||
            a.category.toLowerCase().contains(_query.toLowerCase()))
        .toList();
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            onChanged: (v) => setState(() => _query = v),
            decoration: const InputDecoration(
              prefixIcon: Icon(Icons.search),
              hintText: 'Tìm kiếm thiết bị...',
              border: OutlineInputBorder(),
            ),
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : filtered.isEmpty
                  ? const Center(child: Text('Không có thiết bị nào.'))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        itemCount: filtered.length,
                        itemBuilder: (_, i) => AssetCard(
                          asset: filtered[i],
                          onTap: () => Navigator.pushNamed(
                              context, '/asset-detail',
                              arguments: filtered[i].id),
                        ),
                      ),
                    ),
        ),
      ],
    );
  }
}

class _HomeNavBar extends StatelessWidget {
  final int current;
  const _HomeNavBar({this.current = 0});

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: current,
      type: BottomNavigationBarType.fixed,
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.explore), label: 'Khám phá'),
        BottomNavigationBarItem(icon: Icon(Icons.receipt_long), label: 'Đơn'),
        BottomNavigationBarItem(icon: Icon(Icons.chat), label: 'Chat'),
        BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Tôi'),
      ],
      onTap: (i) {
        switch (i) {
          case 0:
            break;
          case 1:
            Navigator.pushNamed(context, '/my-orders');
            break;
          case 2:
            Navigator.pushNamed(context, '/conversations');
            break;
          case 3:
            Navigator.pushNamed(context, '/profile');
            break;
        }
      },
    );
  }
}
