import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:velox_mobile/main.dart';
import 'package:velox_mobile/providers/auth_provider.dart';
import 'package:velox_mobile/widgets/brand_logo.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  List<_Item> _itemsFor(String? role) {
    const all = [
      _Item(icon: Icons.chat_bubble_outline, label: 'Tin nhắn', route: AppRoutes.conversations),
      _Item(icon: Icons.notifications_outlined, label: 'Thông báo', route: AppRoutes.notifications),
      _Item(icon: Icons.person_outline, label: 'Hồ sơ', route: AppRoutes.profile),
    ];
    switch (role) {
      case 'lender':
        return [
          _Item(icon: Icons.dashboard_outlined, label: 'Dashboard', route: AppRoutes.lenderDashboard),
          _Item(icon: Icons.inventory_2_outlined, label: 'Kho thiết bị', route: AppRoutes.lenderInventory),
          _Item(icon: Icons.add_circle_outline, label: 'Đăng thiết bị', route: AppRoutes.postAsset),
          _Item(icon: Icons.receipt_long_outlined, label: 'Đơn thuê', route: AppRoutes.myOrders),
          ...all,
        ];
      case 'inspector':
        return [
          _Item(icon: Icons.dashboard_outlined, label: 'Dashboard', route: AppRoutes.inspectorDashboard),
          ...all,
        ];
      case 'admin':
        return [
          _Item(icon: Icons.dashboard_outlined, label: 'Dashboard', route: AppRoutes.adminDashboard),
          _Item(icon: Icons.people_outline, label: 'Người dùng', route: AppRoutes.adminDashboard),
          _Item(icon: Icons.receipt_long_outlined, label: 'Đơn hàng', route: AppRoutes.myOrders),
          ...all,
        ];
      case 'renter':
      default:
        return [
          _Item(icon: Icons.explore_outlined, label: 'Khám phá', route: AppRoutes.browse),
          _Item(icon: Icons.verified_user_outlined, label: 'Xác thực eKYC', route: AppRoutes.renterEkyc),
          _Item(icon: Icons.receipt_long_outlined, label: 'Đơn thuê', route: AppRoutes.myOrders),
          ...all,
        ];
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final role = auth.role ?? 'renter';
    final items = _itemsFor(role);
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(color: Color(0xFF006C49)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const BrandLogo(size: 26, withName: true),
                const SizedBox(height: 8),
                Text(auth.user?.name ?? '',
                    style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                Text('Vai trò: $role',
                    style: const TextStyle(color: Colors.white70, fontSize: 13)),
              ],
            ),
          ),
          ...items.map((it) => ListTile(
                leading: Icon(it.icon, color: const Color(0xFF006C49)),
                title: Text(it.label),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.pushReplacementNamed(context, it.route);
                },
              )),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Color(0xFFBA1A1A)),
            title: const Text('Đăng xuất', style: TextStyle(color: Color(0xFFBA1A1A))),
            onTap: () async {
              Navigator.pop(context);
              await auth.logout();
              if (!context.mounted) return;
              Navigator.pushReplacementNamed(context, AppRoutes.login);
            },
          ),
        ],
      ),
    );
  }
}

class _Item {
  final IconData icon;
  final String label;
  final String route;
  const _Item({required this.icon, required this.label, required this.route});
}
