import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:velox_mobile/core/theme.dart';
import 'package:velox_mobile/main.dart';
import 'package:velox_mobile/providers/auth_provider.dart';
import 'package:velox_mobile/services/auth_service.dart';
import 'package:velox_mobile/widgets/common.dart';
import 'package:velox_mobile/widgets/equip_dialog.dart';
import 'package:velox_mobile/widgets/app_shell.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final u = auth.user;
    return MainScaffold(
      currentIndex: 4,
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SizedBox(height: 8),
          CircleAvatar(
            radius: 44,
            backgroundColor: AppTheme.primaryContainer.withValues(alpha: 0.15),
            child: Text(UiHelper.initials(u?.name ?? '?'),
                style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppTheme.primaryContainer)),
          ),
          const SizedBox(height: 12),
          Center(
            child: Text(u?.name ?? '',
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, fontFamily: 'PlusJakartaSans')),
          ),
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 4),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '${_roleLabel(u?.role)}  •  Uy tín: ${u?.reputationScore?.toStringAsFixed(1) ?? '5.0'}',
                style: const TextStyle(fontSize: 13, color: AppTheme.primary, fontWeight: FontWeight.w600),
              ),
            ),
          ),
          if (u != null && !u.isProfileCompleted)
            Container(
              margin: const EdgeInsets.only(top: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 20),
                  SizedBox(width: 10),
                  Expanded(child: Text('Hoàn thiện hồ sơ để thuê/cho thuê',
                      style: TextStyle(fontSize: 13, color: Colors.orange, fontWeight: FontWeight.w500))),
                ],
              ),
            ),
          const SizedBox(height: 20),
          _buildSection(context, [
            _MenuItem(
              icon: Icons.verified_user_rounded,
              title: 'Xác thực CCCD (Renter eKYC)',
              subtitle: 'Trạng thái: ${u?.renterStatus ?? 'none'}',
              trailing: const Icon(Icons.chevron_right, color: AppTheme.onSurfaceVariant),
              onTap: () => Navigator.pushNamed(context, '/renter-ekyc'),
            ),
            _MenuItem(
              icon: Icons.storefront_rounded,
              title: 'Trở thành Người cho thuê',
              subtitle: 'Trạng thái: ${u?.lenderStatus ?? 'none'}',
              trailing: const Icon(Icons.chevron_right, color: AppTheme.onSurfaceVariant),
              onTap: () => Navigator.pushNamed(context, '/lender-onboarding'),
            ),
            _MenuItem(
              icon: Icons.account_balance_wallet_rounded,
              title: 'Số dư ví',
              trailing: const Icon(Icons.chevron_right, color: AppTheme.onSurfaceVariant),
              onTap: () async {
                UiHelper.showLoading(context);
                try {
                  final bal = await AuthService.getBalance();
                  if (!context.mounted) return;
                  UiHelper.hideLoading(context);
                  EquipDialog.info(context, 'Số dư ví của bạn là ${UiHelper.formatVnd(bal)}');
                } catch (e) {
                  if (context.mounted) UiHelper.hideLoading(context);
                  UiHelper.showErrorToast(context, e);
                }
              },
            ),
            if (u?.role == 'lender' || u?.lenderStatus == 'approved')
              _MenuItem(
                icon: Icons.dashboard_rounded,
                title: 'Dashboard Người cho thuê',
                trailing: const Icon(Icons.chevron_right, color: AppTheme.onSurfaceVariant),
                onTap: () => Navigator.pushNamed(context, '/lender/dashboard'),
              ),
          ]),
          const SizedBox(height: 16),
          _buildSection(context, [
            if (u?.role == 'renter' || u?.role == 'lender')
              _MenuItem(
                icon: Icons.swap_horiz_rounded,
                title: 'Đổi vai trò',
                subtitle: 'Hiện tại: ${_roleLabel(u?.role)}',
                onTap: () async {
                  final target = u?.role == 'lender' ? 'Renter' : 'Lender';
                  final confirmed = await EquipDialog.confirm(
                      context, 'Đổi vai trò', 'Chuyển sang $target? Trang hiện tại sẽ được tải lại.');
                  if (confirmed != true) return;
                  try {
                    await auth.switchRole();
                    if (!context.mounted) return;
                    EquipDialog.success(context, 'Đã chuyển sang $target.');
                    Navigator.pushReplacementNamed(context, AppRoutes.homeForRole(auth.role));
                  } catch (e) {
                    UiHelper.showErrorToast(context, e);
                  }
                },
              ),
            _MenuItem(
              icon: Icons.logout_rounded,
              title: 'Đăng xuất',
              iconColor: AppTheme.error,
              onTap: () async {
                final confirmed = await EquipDialog.confirm(
                    context, 'Đăng xuất', 'Bạn có chắc muốn đăng xuất?');
                if (confirmed != true) return;
                await auth.logout();
                if (!context.mounted) return;
                Navigator.pushReplacementNamed(context, '/login');
              },
            ),
          ]),
        ],
      ),
    );
  }

  Widget _buildSection(BuildContext context, List<_MenuItem> items) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: List.generate(items.length, (i) {
          final item = items[i];
          return Column(
            children: [
              if (i > 0) const Divider(height: 1, indent: 56),
              ListTile(
                leading: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: (item.iconColor ?? AppTheme.primaryContainer).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(item.icon, color: item.iconColor ?? AppTheme.primaryContainer, size: 22),
                ),
                title: Text(item.title,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                subtitle: item.subtitle != null
                    ? Text(item.subtitle!, style: const TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant))
                    : null,
                trailing: item.trailing,
                onTap: item.onTap,
              ),
            ],
          );
        }),
      ),
    );
  }

  static String _roleLabel(String? role) {
    switch (role) {
      case 'renter': return 'Người thuê';
      case 'lender': return 'Người cho thuê';
      case 'inspector': return 'Kiểm định viên';
      case 'admin': return 'Quản trị viên';
      default: return role ?? '';
    }
  }
}

class _MenuItem {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Color? iconColor;
  final Widget? trailing;
  final VoidCallback? onTap;
  const _MenuItem({
    required this.icon,
    required this.title,
    this.subtitle,
    this.iconColor,
    this.trailing,
    this.onTap,
  });
}
