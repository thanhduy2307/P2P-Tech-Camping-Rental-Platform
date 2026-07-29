import 'package:flutter/material.dart';
import 'package:velox_mobile/models/notification.dart';
import 'package:velox_mobile/services/post_service.dart';
import 'package:velox_mobile/core/theme.dart';
import 'package:velox_mobile/widgets/common.dart';
import 'package:velox_mobile/widgets/equip_dialog.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<AppNotification> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _items = await NotificationService.getNotifications();
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thông báo'),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all),
            onPressed: () async {
              try {
                await NotificationService.markAllRead();
                if (!mounted) return;
                _load();
                UiHelper.showSuccessToast(context, 'Đã đánh dấu tất cả là đã đọc');
              } catch (e) {
                if (mounted) UiHelper.showErrorToast(context, e);
              }
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.notifications_off_rounded, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text('Chưa có thông báo nào'),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    itemCount: _items.length,
                    itemBuilder: (_, i) {
                      final n = _items[i];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: Container(
                          decoration: BoxDecoration(
                            border: Border(
                              left: BorderSide(
                                color: n.isRead ? Colors.grey : const Color(0xFF10B981),
                                width: 4,
                              ),
                            ),
                          ),
                          child: ListTile(
                            leading: Icon(
                              n.isRead ? Icons.notifications_none : Icons.notifications_active,
                              color: n.isRead ? Colors.grey : const Color(0xFF10B981),
                            ),
                            title: Text(n.title),
                            subtitle: Text(n.message),
                            onTap: () async {
                              try {
                                await NotificationService.markRead(n.id);
                                if (!mounted) return;
                                _load();
                                if (n.link != null && n.link!.isNotEmpty) {
                                  _navigate(n.link!);
                                }
                              } catch (e) {
                                if (mounted) UiHelper.showErrorToast(context, e);
                              }
                            },
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  void _navigate(String link) {
    final uri = Uri.tryParse(link);
    if (uri == null) return;
    final path = uri.path;
    final segments = path.split('/').where((s) => s.isNotEmpty).toList();
    if (segments.isEmpty) return;

    final first = segments[0];
    if (first == 'orders' && segments.length >= 2) {
      Navigator.pushNamed(context, '/order-detail', arguments: segments[1]);
    } else if (first == 'chats' && segments.length >= 2) {
      Navigator.pushNamed(context, '/chat', arguments: segments[1]);
    } else if (first == 'conversations') {
      Navigator.pushNamed(context, '/conversations');
    } else if (first == 'assets' && segments.length >= 2) {
      Navigator.pushNamed(context, '/asset-detail', arguments: segments[1]);
    } else if (first == 'profile') {
      Navigator.pushNamed(context, '/profile');
    } else if (first == 'my-orders') {
      Navigator.pushNamed(context, '/my-orders');
    }
  }
}
