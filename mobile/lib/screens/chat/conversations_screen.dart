import 'package:flutter/material.dart';
import 'package:velox_mobile/models/message.dart';
import 'package:velox_mobile/services/chat_service.dart';
import 'package:velox_mobile/widgets/common.dart';
import 'package:velox_mobile/widgets/app_shell.dart';

class ConversationsScreen extends StatefulWidget {
  const ConversationsScreen({super.key});

  @override
  State<ConversationsScreen> createState() => _ConversationsScreenState();
}

class _ConversationsScreenState extends State<ConversationsScreen> {
  List<Conversation> _list = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _list = await ChatService.getConversations();
    } catch (e) {
      if (mounted) UiHelper.showErrorToast(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MainScaffold(
      currentIndex: 3,
      body: Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text('Tin nhắn',
                  style: TextStyle(fontFamily: 'PlusJakartaSans', fontWeight: FontWeight.w800, fontSize: 22)),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _list.isEmpty
                    ? const Center(child: Text('Chưa có cuộc trò chuyện nào.'))
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.builder(
                          itemCount: _list.length,
                          itemBuilder: (_, i) {
                            final c = _list[i];
                            return Card(
                              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                              child: ListTile(
                                leading: CircleAvatar(
                                    backgroundColor: const Color(0xFF10B981),
                                    child: Text(UiHelper.initials(c.peerName),
                                        style: const TextStyle(color: Color(0xFF005236)))),
                                title: Text(c.peerName, style: const TextStyle(fontWeight: FontWeight.w600)),
                                subtitle: Text(c.lastMessage),
                                trailing: c.unreadCount > 0
                                    ? CircleAvatar(
                                        radius: 12,
                                        backgroundColor: const Color(0xFFBA1A1A),
                                        child: Text('${c.unreadCount}',
                                            style: const TextStyle(
                                                color: Colors.white, fontSize: 11)))
                                    : null,
                                onTap: () => Navigator.pushNamed(context, '/chat',
                                    arguments: {
                                      'peerId': c.peerId,
                                      'peerName': c.peerName
                                    }).then((_) => _load()),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
