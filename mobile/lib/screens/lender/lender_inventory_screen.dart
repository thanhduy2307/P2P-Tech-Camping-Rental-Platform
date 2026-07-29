import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:velox_mobile/core/theme.dart';
import 'package:velox_mobile/models/asset.dart';
import 'package:velox_mobile/services/asset_service.dart';
import 'package:velox_mobile/widgets/app_shell.dart';
import 'package:velox_mobile/widgets/common.dart';
import 'package:velox_mobile/widgets/equip_dialog.dart';

class LenderInventoryScreen extends StatefulWidget {
  const LenderInventoryScreen({super.key});

  @override
  State<LenderInventoryScreen> createState() => _LenderInventoryScreenState();
}

class _LenderInventoryScreenState extends State<LenderInventoryScreen> {
  List<Asset> _assets = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _assets = await AssetService.getMyAssets();
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MainScaffold(
      showBottomNav: false,
      showDrawer: true,
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.pushNamed(context, '/lender/post-asset'),
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _assets.isEmpty
              ? const Center(child: Text('Chưa có thiết bị nào.'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _assets.length,
                    itemBuilder: (_, i) => _buildAssetCard(_assets[i]),
                  ),
                ),
    );
  }

  Widget _buildAssetCard(Asset asset) {
    final statusLabel = _statusLabel(asset.status);
    final statusColor = _statusColor(asset.status);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 12, offset: const Offset(0, 4))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: AspectRatio(
                aspectRatio: 1.3,
                child: Stack(fit: StackFit.expand, children: [
                  asset.images.isNotEmpty
                      ? CachedNetworkImage(imageUrl: asset.images.first, fit: BoxFit.cover, placeholder: (_, __) => Container(color: Colors.grey[200]),
                          errorWidget: (_, __, ___) => Container(color: Colors.grey[200], child: const Icon(Icons.image, color: Colors.grey)))
                      : Container(color: Colors.grey[200], child: const Icon(Icons.image, color: Colors.grey)),
                  Positioned(top: 12, right: 12, child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.9), borderRadius: BorderRadius.circular(999)),
                    child: Text(statusLabel, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)),
                  )),
                ]),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: AppTheme.primaryContainer.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(999)),
                  child: Text(asset.category, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.primary)),
                ),
                const SizedBox(height: 8),
                InkWell(
                  onTap: () => Navigator.pushNamed(context, '/asset-detail', arguments: asset.id),
                  child: Text(asset.name, maxLines: 2, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppTheme.onSurface)),
                ),
                const SizedBox(height: 8),
                Row(children: [
                  Text(UiHelper.formatVnd(asset.pricePerDay), style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w800, fontSize: 15)),
                  const Text(' / ngày', style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant)),
                ]),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.edit, size: 16),
                      label: const Text('Sửa', style: TextStyle(fontSize: 12)),
                      onPressed: () => Navigator.pushNamed(context, '/lender/post-asset', arguments: asset.id),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: Icon(asset.status == 'verified' ? Icons.block : Icons.check_circle, size: 16),
                      label: Text(asset.status == 'verified' ? 'Ẩn' : 'Hiện', style: const TextStyle(fontSize: 12)),
                      onPressed: () => _toggleStatus(asset),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.date_range, size: 16),
                      label: const Text('Lịch', style: TextStyle(fontSize: 12)),
                      onPressed: () => _showBlockDates(asset),
                    ),
                  ),
                ]),
              ]),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _toggleStatus(Asset asset) async {
    final newStatus = asset.status == 'verified' ? 'unavailable' : (asset.status == 'unavailable' ? 'verified' : 'verified');
    try {
      await AssetService.updateAssetStatus(asset.id, newStatus);
      UiHelper.showSuccessToast(context, 'Đã cập nhật trạng thái');
      _load();
    } catch (e) {
      UiHelper.showErrorToast(context, e);
    }
  }

  Future<void> _showBlockDates(Asset asset) async {
    final startCtl = TextEditingController();
    final endCtl = TextEditingController();
    await showDialog(context: context, builder: (_) => AlertDialog(
      title: const Text('Chặn ngày'),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(controller: startCtl, decoration: const InputDecoration(labelText: 'Ngày bắt đầu (yyyy-MM-dd)')),
        const SizedBox(height: 8),
        TextField(controller: endCtl, decoration: const InputDecoration(labelText: 'Ngày kết thúc (yyyy-MM-dd)')),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Đóng')),
        ElevatedButton(onPressed: () async {
          Navigator.pop(context);
          UiHelper.showLoading(context);
          try {
            await AssetService.blockDates(asset.id, startCtl.text, endCtl.text);
            if (mounted) UiHelper.hideLoading(context);
            UiHelper.showSuccessToast(context, 'Đã chặn ngày');
          } catch (e) {
            if (mounted) UiHelper.hideLoading(context);
            UiHelper.showErrorToast(context, e);
          }
        }, child: const Text('Chặn')),
      ],
    ));
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'verified':
        return 'Đã duyệt';
      case 'pending':
        return 'Chờ duyệt';
      case 'rejected':
        return 'Từ chối';
      default:
        return status;
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'verified':
        return AppTheme.primaryContainer;
      case 'pending':
        return AppTheme.secondary;
      case 'rejected':
        return AppTheme.error;
      default:
        return AppTheme.onSurfaceVariant;
    }
  }
}
