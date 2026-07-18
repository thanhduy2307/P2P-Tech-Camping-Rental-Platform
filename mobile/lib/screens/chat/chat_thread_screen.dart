import 'package:flutter/material.dart';
import 'package:velox_mobile/models/message.dart';
import 'package:velox_mobile/services/chat_service.dart';
import 'package:velox_mobile/core/storage.dart';
import 'package:velox_mobile/widgets/common.dart';

class ChatThreadScreen extends StatefulWidget {
  const ChatThreadScreen({super.key});

  @override
  State<ChatThreadScreen> createState() => _ChatThreadScreenState();
}

class _ChatThreadScreenState extends State<ChatThreadScreen> {
  List<Message> _messages = [];
  bool _loading = true;
  final _ctrl = TextEditingController();
  String _peerId = '';
  String _peerName = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final args = ModalRoute.of(context)?.settings.arguments as Map?;
      _peerId = args?['peerId']?.toString() ?? '';
      _peerName = args?['peerName']?.toString() ?? 'Chat';
      _load();
    });
  }

  Future<void> _load() async {
    try {
      _messages = await ChatService.getMessages(_peerId);
      await ChatService.markAsRead(_peerId);
    } catch (e) {
      if (mounted) UiHelper.showError(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    _ctrl.clear();
    try {
      await ChatService.sendMessage(receiverId: _peerId, content: text);
      _load();
    } catch (e) {
      UiHelper.showError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final meId = Storage.getUser()?['_id']?.toString() ?? '';
    return Scaffold(
      appBar: AppBar(title: Text(_peerName)),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    reverse: true,
                    itemCount: _messages.length,
                    itemBuilder: (_, i) {
                      final m = _messages[_messages.length - 1 - i];
                      final mine = m.senderId == meId;
                      return Align(
                        alignment:
                            mine ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.symmetric(
                              vertical: 4, horizontal: 10),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: mine ? Colors.blue : Colors.grey[200],
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(m.content,
                              style: TextStyle(
                                  color: mine ? Colors.white : Colors.black)),
                        ),
                      );
                    },
                  ),
          ),
          Padding(
            padding: const EdgeInsets.all(8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _ctrl,
                    decoration:
                        const InputDecoration(hintText: 'Nhập tin nhắn...'),
                  ),
                ),
                IconButton(
                    icon: const Icon(Icons.send),
                    onPressed: _send),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
