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
                _load();
                UiHelper.showSuccessToast(context, 'Đã đánh dấu tất cả là đã đọc');
              } catch (e) {
                UiHelper.showErrorToast(context, e);
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
                                _load();
                              } catch (e) {
                                UiHelper.showErrorToast(context, e);
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
}
