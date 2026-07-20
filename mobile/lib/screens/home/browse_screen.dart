import 'package:flutter/material.dart';
import 'package:velox_mobile/models/asset.dart';
import 'package:velox_mobile/services/asset_service.dart';
import 'package:velox_mobile/widgets/asset_card.dart';
import 'package:velox_mobile/widgets/common.dart';
import 'package:velox_mobile/widgets/app_shell.dart';

class BrowseScreen extends StatelessWidget {
  const BrowseScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return MainScaffold(
      currentIndex: 0,
      body: const _BrowseBody(),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF10B981),
        foregroundColor: const Color(0xFF005236),
        tooltip: 'AI gợi ý theo nhu cầu',
        onPressed: () => _showAiRecommend(context),
        child: const Icon(Icons.auto_awesome),
      ),
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
              decoration: const InputDecoration(hintText: 'Nhu cầu của bạn...'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Hủy')),
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
                      child: Text(data['recommendations']?.toString() ?? 'Không có gợi ý.'),
                    ),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(context), child: const Text('Đóng')),
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

class _BrowseBody extends StatefulWidget {
  const _BrowseBody();

  @override
  State<_BrowseBody> createState() => _BrowseBodyState();
}

class _BrowseBodyState extends State<_BrowseBody> {
  List<Asset> _assets = [];
  bool _loading = true;
  String _query = '';
  String _category = 'Tất cả';

  final List<String> _categories = [
    'Tất cả', 'Công nghệ', 'Cắm trại', 'Blogs'
  ];

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

  List<Asset> get _filtered {
    return _assets.where((a) {
      final matchQ = a.name.toLowerCase().contains(_query.toLowerCase()) ||
          a.category.toLowerCase().contains(_query.toLowerCase());
      final matchC = _category == 'Tất cả' || a.category == _category;
      return matchQ && matchC;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Khám phá thiết bị cắm trại',
                    style: const TextStyle(fontFamily: 'PlusJakartaSans', fontWeight: FontWeight.w800, fontSize: 22),
                  ),
                  const SizedBox(height: 4),
                  const Text('Thuê thiết bị chất lượng từ cộng đồng EquipPeer',
                      style: TextStyle(fontSize: 14, color: Color(0xFF3C4A42))),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F4F2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFBBCABF)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.search, color: Color(0xFF3C4A42)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            onChanged: (v) => setState(() => _query = v),
                            decoration: const InputDecoration(
                              hintText: 'Tìm kiếm thiết bị...',
                              border: InputBorder.none,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    height: 36,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _categories.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (_, i) {
                        final c = _categories[i];
                        final active = c == _category;
                        return GestureDetector(
                          onTap: () => setState(() => _category = c),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            decoration: BoxDecoration(
                              color: active ? const Color(0xFF10B981).withValues(alpha: 0.12) : const Color(0xFFEDF0EE),
                              borderRadius: BorderRadius.circular(999),
                              border: active
                                  ? Border.all(color: const Color(0xFF10B981))
                                  : null,
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              c,
                              style: TextStyle(
                                fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                                color: active ? const Color(0xFF006C49) : const Color(0xFF3C4A42),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_loading)
            const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))
          else if (_filtered.isEmpty)
            const SliverFillRemaining(child: Center(child: Text('Không có thiết bị nào.')))
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 14,
                  crossAxisSpacing: 14,
                  childAspectRatio: 0.72,
                ),
                delegate: SliverChildBuilderDelegate(
                  (_, i) => AssetCard(
                    asset: _filtered[i],
                    onTap: () => Navigator.pushNamed(context, '/asset-detail',
                        arguments: _filtered[i].id),
                  ),
                  childCount: _filtered.length,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
