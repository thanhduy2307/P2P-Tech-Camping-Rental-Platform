import 'package:flutter/material.dart';
import 'package:velox_mobile/models/notification.dart';
import 'package:velox_mobile/services/post_service.dart';
import 'package:velox_mobile/widgets/common.dart';

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
      if (mounted) UiHelper.showError(context, e);
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
              } catch (e) {
                UiHelper.showError(context, e);
              }
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
              ? const Center(child: Text('Chưa có thông báo.'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    itemCount: _items.length,
                    itemBuilder: (_, i) {
                      final n = _items[i];
                      return ListTile(
                        leading: Icon(
                          n.isRead ? Icons.notifications_none : Icons.notifications_active,
                          color: n.isRead ? Colors.grey : Colors.blue,
                        ),
                        title: Text(n.title),
                        subtitle: Text(n.message),
                        onTap: () async {
                          try {
                            await NotificationService.markRead(n.id);
                            _load();
                          } catch (e) {
                            UiHelper.showError(context, e);
                          }
                        },
                      );
                    },
                  ),
                ),
    );
  }
}
