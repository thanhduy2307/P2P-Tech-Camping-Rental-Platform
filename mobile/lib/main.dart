import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:velox_mobile/core/storage.dart';
import 'package:velox_mobile/providers/auth_provider.dart';
import 'package:velox_mobile/screens/splash_screen.dart';
import 'package:velox_mobile/screens/auth/login_screen.dart';
import 'package:velox_mobile/screens/auth/register_screen.dart';
import 'package:velox_mobile/screens/auth/otp_screen.dart';
import 'package:velox_mobile/screens/auth/renter_ekyc_screen.dart';
import 'package:velox_mobile/screens/auth/lender_onboarding_screen.dart';
import 'package:velox_mobile/screens/home/browse_screen.dart';
import 'package:velox_mobile/screens/home/asset_detail_screen.dart';
import 'package:velox_mobile/screens/orders/my_orders_screen.dart';
import 'package:velox_mobile/screens/orders/order_detail_screen.dart';
import 'package:velox_mobile/screens/chat/conversations_screen.dart';
import 'package:velox_mobile/screens/chat/chat_thread_screen.dart';
import 'package:velox_mobile/screens/profile/profile_screen.dart';
import 'package:velox_mobile/screens/lender/lender_dashboard_screen.dart';
import 'package:velox_mobile/screens/lender/post_asset_screen.dart';
import 'package:velox_mobile/screens/lender/lender_inventory_screen.dart';
import 'package:velox_mobile/screens/inspector/inspector_dashboard_screen.dart';
import 'package:velox_mobile/screens/admin/admin_dashboard_screen.dart';
import 'package:velox_mobile/screens/notifications/notifications_screen.dart';
import 'package:velox_mobile/core/constants.dart';
import 'package:velox_mobile/core/theme.dart';

class AppRoutes {
  static const splash = '/';
  static const login = '/login';
  static const register = '/register';
  static const otp = '/otp';
  static const renterEkyc = '/renter-ekyc';
  static const lenderOnboarding = '/lender-onboarding';
  static const browse = '/browse';
  static const assetDetail = '/asset-detail';
  static const myOrders = '/my-orders';
  static const orderDetail = '/order-detail';
  static const conversations = '/conversations';
  static const chatThread = '/chat';
  static const profile = '/profile';
  static const lenderDashboard = '/lender/dashboard';
  static const postAsset = '/lender/post-asset';
  static const lenderInventory = '/lender/inventory';
  static const inspectorDashboard = '/inspector/dashboard';
  static const adminDashboard = '/admin/dashboard';
  static const notifications = '/notifications';

  static String homeForRole(String? role) {
    switch (role) {
      case 'lender':
        return lenderDashboard;
      case 'inspector':
        return inspectorDashboard;
      case 'admin':
        return adminDashboard;
      case 'renter':
      default:
        return browse;
    }
  }
}

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    _lastError = details.exception.toString();
  };
  runZonedGuarded(
    () async {
      await Storage.init();
      runApp(const MyApp());
    },
    (error, stack) {
      _lastError = error.toString();
      runApp(MaterialApp(
        home: Scaffold(
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Text('EquipPeer lỗi khởi động:\n\n$error\n\n$stack',
                  style: const TextStyle(fontSize: 13, color: Colors.red)),
            ),
          ),
        ),
      ));
    },
  );
}

String? _lastError;

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: MaterialApp(
        title: 'EquipPeer',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        builder: (context, child) {
          return MediaQuery(
            data: MediaQuery.of(context).copyWith(textScaler: const TextScaler.linear(1.0)),
            child: child!,
          );
        },
        initialRoute: AppRoutes.splash,
        routes: {
          AppRoutes.splash: (_) => const SplashScreen(),
          AppRoutes.login: (_) => const LoginScreen(),
          AppRoutes.register: (_) => const RegisterScreen(),
          AppRoutes.otp: (_) => const OtpScreen(),
          AppRoutes.renterEkyc: (_) => const RenterEkycScreen(),
          AppRoutes.lenderOnboarding: (_) => const LenderOnboardingScreen(),
          AppRoutes.browse: (_) => const BrowseScreen(),
          AppRoutes.assetDetail: (_) => const AssetDetailScreen(),
          AppRoutes.myOrders: (_) => const MyOrdersScreen(),
          AppRoutes.orderDetail: (_) => const OrderDetailScreen(),
          AppRoutes.conversations: (_) => const ConversationsScreen(),
          AppRoutes.chatThread: (_) => const ChatThreadScreen(),
          AppRoutes.profile: (_) => const ProfileScreen(),
          AppRoutes.lenderDashboard: (_) => const LenderDashboardScreen(),
          AppRoutes.postAsset: (_) => const PostAssetScreen(),
          AppRoutes.lenderInventory: (_) => const LenderInventoryScreen(),
          AppRoutes.inspectorDashboard: (_) => const InspectorDashboardScreen(),
          AppRoutes.adminDashboard: (_) => const AdminDashboardScreen(),
          AppRoutes.notifications: (_) => const NotificationsScreen(),
        },
      ),
    );
  }
}
