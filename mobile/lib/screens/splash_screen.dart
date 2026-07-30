import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:velox_mobile/core/storage.dart';
import 'package:velox_mobile/providers/auth_provider.dart';
import 'package:velox_mobile/main.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 800), () {
      if (!mounted) return;
      try {
        if (Storage.isLoggedIn()) {
          final role = Provider.of<AuthProvider>(context, listen: false).role;
          Navigator.pushReplacementNamed(context, AppRoutes.homeForRole(role ?? 'renter'));
        } else {
          Navigator.pushReplacementNamed(context, AppRoutes.login);
        }
      } catch (_) {
        Navigator.pushReplacementNamed(context, AppRoutes.login);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.explore, size: 80, color: Color(0xFF006C49)),
            SizedBox(height: 16),
            Text('EquipPeer',
                style: TextStyle(fontFamily: 'PlusJakartaSans', fontSize: 32, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text('Thuê đồ cắm trại & công nghệ P2P'),
          ],
        ),
      ),
    );
  }
}
