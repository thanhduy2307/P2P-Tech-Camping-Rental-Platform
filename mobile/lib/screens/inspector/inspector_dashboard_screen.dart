import 'package:flutter/material.dart';
import 'package:velox_mobile/widgets/app_shell.dart';

class InspectorDashboardScreen extends StatelessWidget {
  const InspectorDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return MainScaffold(
      showTopBar: true,
      showBottomNav: false,
      currentIndex: 0,
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          Text('Dashboard Kiểm định viên',
              style: TextStyle(fontFamily: 'PlusJakartaSans', fontWeight: FontWeight.w800, fontSize: 22)),
          SizedBox(height: 8),
          Text('Danh sách yêu cầu kiểm định thiết bị sẽ hiển thị tại đây.',
              style: TextStyle(color: Color(0xFF3C4A42))),
          SizedBox(height: 16),
          Card(
            child: ListTile(
              leading: Icon(Icons.verified_user, color: Color(0xFF006C49)),
              title: Text('Chưa có task kiểm định'),
              subtitle: Text('Hệ thống sẽ đẩy task khi có đơn cần duyệt'),
            ),
          ),
        ],
      ),
    );
  }
}
