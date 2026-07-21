import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:velox_mobile/core/theme.dart';
import 'package:velox_mobile/models/asset.dart';
import 'package:velox_mobile/providers/auth_provider.dart';
import 'package:velox_mobile/services/asset_service.dart';
import 'package:velox_mobile/services/auth_service.dart';
import 'package:velox_mobile/widgets/app_shell.dart';
import 'package:velox_mobile/widgets/common.dart';
import 'package:velox_mobile/widgets/equip_dialog.dart';

class LenderDashboardScreen extends StatefulWidget {
  const LenderDashboardScreen({super.key});

  @override
  State<LenderDashboardScreen> createState() => _LenderDashboardScreenState();
}

class _LenderDashboardScreenState extends State<LenderDashboardScreen> {
  int _assetCount = 0;
  int _activeRentals = 0;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final assets = await AssetService.getMyAssets();
      if (!mounted) return;
      setState(() {
        _assetCount = assets.length;
        _activeRentals = assets.where((a) => a.status == 'rented').length;
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    return MainScaffold(
      showBottomNav: false,
      showDrawer: true,
      body: ListView(
        padding: const EdgeInsets.all(16),
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
            child: Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: AppTheme.primaryContainer.withValues(alpha: 0.12),
                  child: Icon(Icons.person, color: AppTheme.primary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(auth.user?.name ?? '',
                          style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: AppTheme.onSurface)),
                      Text('Vai trò: ${auth.user?.role ?? ''}',
                          style: TextStyle(
                              color: AppTheme.onSurfaceVariant, fontSize: 13)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppTheme.primary, AppTheme.primaryContainer],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primary.withValues(alpha: 0.2),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Row(
              children: [
                _statItem(Icons.inventory_2, '$_assetCount', 'Tổng thiết bị'),
                Container(
                  width: 1,
                  height: 40,
                  color: Colors.white.withValues(alpha: 0.3),
                ),
                _statItem(Icons.receipt_long, '$_activeRentals', 'Đang cho thuê'),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Text('Quản lý',
              style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                  color: AppTheme.onSurfaceVariant)),
          const SizedBox(height: 8),
          _menuTile(Icons.add_box, 'Đăng thiết bị mới',
              () => Navigator.pushNamed(context, '/lender/post-asset')),
          const SizedBox(height: 8),
          _menuTile(Icons.inventory_2, 'Quản lý thiết bị',
              () => Navigator.pushNamed(context, '/lender/inventory')),
          const SizedBox(height: 8),
          _menuTile(Icons.receipt_long, 'Đơn cho thuê đến',
              () => Navigator.pushNamed(context, '/my-orders')),
          const SizedBox(height: 8),
          _menuTile(Icons.account_balance_wallet, 'Kiểm tra số dư', () async {
            UiHelper.showLoading(context);
            try {
              final bal = await AuthService.getBalance();
              if (!context.mounted) return;
              UiHelper.hideLoading(context);
              EquipDialog.info(context, 'Số dư ví: ${UiHelper.formatVnd(bal)}');
            } catch (e) {
              if (!context.mounted) return;
              UiHelper.hideLoading(context);
              UiHelper.showErrorToast(context, e);
            }
          }),
        ],
      ),
    );
  }

  Widget _statItem(IconData icon, String value, String label) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: Colors.white, size: 28),
          const SizedBox(height: 6),
          Text(value,
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 20)),
          Text(label,
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.85), fontSize: 12)),
        ],
      ),
    );
  }

  Widget _menuTile(IconData icon, String title, VoidCallback onTap) {
    return Container(
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
      child: ListTile(
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AppTheme.primaryContainer.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: AppTheme.primary),
        ),
        title: Text(title,
            style: const TextStyle(
                fontWeight: FontWeight.w600, color: AppTheme.onSurface)),
                      trailing: Icon(Icons.chevron_right,
                          color: AppTheme.onSurfaceVariant),
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }
}

