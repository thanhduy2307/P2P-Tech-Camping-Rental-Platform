import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:velox_mobile/core/constants.dart';
import 'package:velox_mobile/providers/auth_provider.dart';
import 'package:velox_mobile/services/auth_service.dart';
import 'package:velox_mobile/widgets/common.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final u = auth.user;
    return Scaffold(
      appBar: AppBar(title: const Text('Tài khoản')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          CircleAvatar(
            radius: 40,
            backgroundColor: const Color(AppConstants.primaryColorValue),
            child: Text(UiHelper.initials(u?.name ?? '?'),
                style: const TextStyle(fontSize: 28, color: Colors.white)),
          ),
          const SizedBox(height: 12),
          Center(
            child: Text(u?.name ?? '',
                style:
                    const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          ),
          Center(
            child: Text('Vai trò: ${u?.role ?? ''}  •  Uy tín: ${u?.reputationScore ?? 5.0}'),
          ),
          const SizedBox(height: 20),
          if (u != null && !u.isProfileCompleted)
            const ListTile(
              leading: Icon(Icons.warning, color: Colors.orange),
              title: Text('Hoàn thiện hồ sơ để thuê/cho thuê'),
            ),
          ListTile(
            leading: const Icon(Icons.verified_user),
            title: const Text('Xác thực CCCD (Renter eKYC)'),
            subtitle: Text('Trạng thái: ${u?.renterStatus ?? 'none'}'),
            onTap: () =>
                Navigator.pushNamed(context, '/renter-ekyc'),
          ),
          ListTile(
            leading: const Icon(Icons.storefront),
            title: const Text('Trở thành Người cho thuê (Lender)'),
            subtitle: Text('Trạng thái: ${u?.lenderStatus ?? 'none'}'),
            onTap: () =>
                Navigator.pushNamed(context, '/lender-onboarding'),
          ),
          ListTile(
            leading: const Icon(Icons.account_balance_wallet),
            title: const Text('Số dư ví'),
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
          if (u?.role == 'lender' || u?.lenderStatus == 'approved')
            ListTile(
              leading: const Icon(Icons.dashboard),
              title: const Text('Dashboard Người cho thuê'),
              onTap: () =>
                  Navigator.pushNamed(context, '/lender/dashboard'),
            ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.swap_horiz),
            title: const Text('Đổi vai trò (Renter/Lender)'),
            onTap: () async {
              try {
                await auth.switchRole();
                if (!context.mounted) return;
                UiHelper.showSuccess(context, 'Đã chuyển vai trò.');
              } catch (e) {
                UiHelper.showError(context, e);
              }
            },
          ),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Đăng xuất'),
            onTap: () async {
              await auth.logout();
              if (!context.mounted) return;
              Navigator.pushReplacementNamed(context, '/login');
            },
          ),
        ],
      ),
    );
  }
}
