import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:velox_mobile/core/theme.dart';
import 'package:velox_mobile/providers/auth_provider.dart';
import 'package:velox_mobile/services/asset_service.dart';
import 'package:velox_mobile/services/auth_service.dart';
import 'package:velox_mobile/widgets/app_shell.dart';
import 'package:velox_mobile/widgets/common.dart';

class LenderDashboardScreen extends StatefulWidget {
  const LenderDashboardScreen({super.key});

  @override
  State<LenderDashboardScreen> createState() => _LenderDashboardScreenState();
}

class _LenderDashboardScreenState extends State<LenderDashboardScreen> {
  int _assetCount = 0;
  int _activeRentals = 0;
  bool _loadingStats = true;
  Map<String, dynamic> _revenue = {};
  bool _loadingRevenue = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadStats());
  }

  Future<void> _loadStats() async {
    try {
      final assets = await AssetService.getMyAssets();
      if (!mounted) return;
      setState(() {
        _assetCount = assets.length;
        _activeRentals = assets.where((a) => a.status == 'rented').length;
        _loadingStats = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingStats = false);
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted && _assetCount == 0) _loadStats();
      });
    }
    _loadRevenue();
  }

  Future<void> _loadRevenue() async {
    try {
      final stats = await AuthService.getLenderStats();
      if (!mounted) return;
      setState(() {
        _revenue = stats;
        _loadingRevenue = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingRevenue = false);
    }
  }

  double _rev(String key) =>
      ((_revenue[key] ?? 0) as num).toDouble();

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
                _statItem(Icons.inventory_2, _loadingStats ? '...' : '$_assetCount', 'Tổng thiết bị'),
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
                Row(
                  children: [
                    const Icon(Icons.trending_up, color: AppTheme.primary, size: 20),
                    const SizedBox(width: 8),
                    const Text('Doanh thu của bạn',
                        style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                            color: AppTheme.onSurface)),
                    const Spacer(),
                    GestureDetector(
                      onTap: _loadRevenue,
                      child: const Icon(Icons.refresh,
                          size: 18, color: AppTheme.onSurfaceVariant),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_loadingRevenue ? '...' : UiHelper.formatVnd(_rev('totalEarnings')),
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 20,
                                  color: AppTheme.primary)),
                          Text('Tổng doanh thu',
                              style: TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.onSurfaceVariant)),
                        ],
                      ),
                    ),
                    Container(
                      width: 1,
                      height: 36,
                      color: AppTheme.onSurfaceVariant.withValues(alpha: 0.15),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_loadingRevenue ? '...' : UiHelper.formatVnd(_rev('monthEarnings')),
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 20,
                                  color: AppTheme.onSurface)),
                          Text('Tháng này',
                              style: TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.onSurfaceVariant)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _revenueMini('Số dư ví', _rev('balance')),
                    const SizedBox(width: 12),
                    _revenueMini('Đã rút', _rev('totalWithdrawn')),
                    const SizedBox(width: 12),
                    _revenueMini('Giao dịch', _rev('transactionCount')),
                  ],
                ),
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
        ],
      ),
    );
  }

  Widget _revenueMini(String label, double value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
        decoration: BoxDecoration(
          color: AppTheme.primaryContainer.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: TextStyle(
                    fontSize: 11, color: AppTheme.onSurfaceVariant)),
            const SizedBox(height: 2),
            Text(_loadingRevenue ? '...' : UiHelper.formatVnd(value),
                style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                    color: AppTheme.onSurface),
                maxLines: 1,
                overflow: TextOverflow.ellipsis),
          ],
        ),
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

