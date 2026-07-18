import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:velox_mobile/providers/auth_provider.dart';
import 'package:velox_mobile/services/auth_service.dart';
import 'package:velox_mobile/widgets/common.dart';

class LenderDashboardScreen extends StatelessWidget {
  const LenderDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Dashboard Lender')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: const Icon(Icons.person),
              title: Text(auth.user?.name ?? ''),
              subtitle: Text('Vai trò: ${auth.user?.role ?? ''}'),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.add_box),
            title: const Text('Đăng thiết bị mới'),
            onTap: () => Navigator.pushNamed(context, '/lender/post-asset'),
          ),
          ListTile(
            leading: const Icon(Icons.inventory_2),
            title: const Text('Quản lý thiết bị'),
            onTap: () => Navigator.pushNamed(context, '/lender/inventory'),
          ),
          ListTile(
            leading: const Icon(Icons.receipt_long),
            title: const Text('Đơn cho thuê đến'),
            onTap: () => Navigator.pushNamed(context, '/my-orders'),
          ),
          ListTile(
            leading: const Icon(Icons.account_balance_wallet),
            title: const Text('Kiểm tra số dư'),
            onTap: () async {
              try {
                final bal = await AuthService.getBalance();
                if (!context.mounted) return;
                UiHelper.showSuccess(
                    context, 'Số dư: ${UiHelper.formatVnd(bal)}');
              } catch (e) {
                UiHelper.showError(context, e);
              }
            },
          ),
        ],
      ),
    );
  }
}
