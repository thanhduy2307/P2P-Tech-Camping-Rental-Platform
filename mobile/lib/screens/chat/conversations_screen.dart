import 'package:flutter/material.dart';
import 'package:velox_mobile/models/message.dart';
import 'package:velox_mobile/services/chat_service.dart';
import 'package:velox_mobile/widgets/common.dart';

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
      if (mounted) UiHelper.showError(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tin nhắn')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _list.isEmpty
              ? const Center(child: Text('Chưa có cuộc trò chuyện nào.'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    itemCount: _list.length,
                    itemBuilder: (_, i) {
                      final c = _list[i];
                      return ListTile(
                        leading: CircleAvatar(
                            child: Text(UiHelper.initials(c.peerName))),
                        title: Text(c.peerName),
                        subtitle: Text(c.lastMessage),
                        trailing: c.unreadCount > 0
                            ? CircleAvatar(
                                radius: 12,
                                backgroundColor: Colors.red,
                                child: Text('${c.unreadCount}',
                                    style: const TextStyle(
                                        color: Colors.white, fontSize: 11)))
                            : null,
                        onTap: () => Navigator.pushNamed(context, '/chat',
                            arguments: {
                              'peerId': c.peerId,
                              'peerName': c.peerName
                            }).then((_) => _load()),
                      );
                    },
                  ),
                ),
    );
  }
}
