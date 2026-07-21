import 'package:flutter/material.dart';
import 'package:velox_mobile/models/message.dart';
import 'package:velox_mobile/services/chat_service.dart';
import 'package:velox_mobile/core/storage.dart';
import 'package:velox_mobile/core/theme.dart';
import 'package:velox_mobile/widgets/common.dart';
import 'package:velox_mobile/widgets/equip_dialog.dart';

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
      if (mounted) UiHelper.showErrorToast(context, e);
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
      UiHelper.showErrorToast(context, e);
    }
  }

  String _formatTime(String raw) {
    try {
      final dt = DateTime.parse(raw);
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return '';
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
                : _messages.isEmpty
                    ? const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey),
                            SizedBox(height: 16),
                            Text('Chưa có tin nhắn nào'),
                          ],
                        ),
                      )
                    : ListView.builder(
                        reverse: true,
                        itemCount: _messages.length,
                        itemBuilder: (_, i) {
                          final m = _messages[_messages.length - 1 - i];
                          final mine = m.senderId == meId;
                          return Align(
                            alignment: mine
                                ? Alignment.centerRight
                                : Alignment.centerLeft,
                            child: Column(
                              crossAxisAlignment: mine
                                  ? CrossAxisAlignment.end
                                  : CrossAxisAlignment.start,
                              children: [
                                Container(
                                  margin: const EdgeInsets.symmetric(
                                      vertical: 2, horizontal: 10),
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 14, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: mine
                                        ? const Color(0xFF10B981)
                                        : const Color(0xFFF1F4F2),
                                    borderRadius: BorderRadius.only(
                                      topLeft: const Radius.circular(18),
                                      topRight: mine
                                          ? const Radius.circular(4)
                                          : const Radius.circular(18),
                                      bottomLeft: mine
                                          ? const Radius.circular(18)
                                          : const Radius.circular(4),
                                      bottomRight:
                                          const Radius.circular(18),
                                    ),
                                  ),
                                  child: Text(m.content,
                                      style: TextStyle(
                                          color: mine
                                              ? Colors.white
                                              : const Color(0xFF0B1C30))),
                                ),
                                Padding(
                                  padding:
                                      const EdgeInsets.symmetric(horizontal: 14),
                                  child: Text(
                                    _formatTime(m.createdAt),
                                    style: const TextStyle(
                                        fontSize: 11,
                                        color: AppTheme.onSurfaceVariant),
                                  ),
                                ),
                              ],
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
                    onSubmitted: (_) => _send(),
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
