import 'package:flutter/material.dart';
import 'package:velox_mobile/core/storage.dart';

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
      if (Storage.isLoggedIn()) {
        Navigator.pushReplacementNamed(context, '/browse');
      } else {
        Navigator.pushReplacementNamed(context, '/login');
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
            Icon(Icons.terrain, size: 80, color: Colors.blue),
            SizedBox(height: 16),
            Text('VeloX',
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text('Thuê đồ cắm trại & công nghệ P2P'),
          ],
        ),
      ),
    );
  }
}
