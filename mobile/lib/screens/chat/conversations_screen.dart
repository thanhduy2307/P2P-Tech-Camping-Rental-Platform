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
                            final avatarColor = UiHelper.nameColor(c.peerId);
                            return Card(
                              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                              child: InkWell(
                                borderRadius: BorderRadius.circular(12),
                                onTap: () => Navigator.pushNamed(context, '/chat',
                                    arguments: {'peerId': c.peerId, 'peerName': c.peerName}).then((_) => _load()),
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Row(
                                    children: [
                                      Stack(
                                        children: [
                                          CircleAvatar(
                                            radius: 24,
                                            backgroundColor: avatarColor.withValues(alpha: 0.15),
                                            child: Text(UiHelper.initials(c.peerName),
                                                style: TextStyle(color: avatarColor, fontWeight: FontWeight.w700, fontSize: 16)),
                                          ),
                                          Positioned(
                                            right: 0, bottom: 0,
                                            child: Container(
                                              width: 12, height: 12,
                                              decoration: BoxDecoration(
                                                color: const Color(0xFF10B981),
                                                shape: BoxShape.circle,
                                                border: Border.all(color: Colors.white, width: 2),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Expanded(child: Text(c.peerName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15))),
                                                Text(UiHelper.timeAgo(c.updatedAt), style: const TextStyle(fontSize: 11, color: Color(0xFF808080))),
                                              ],
                                            ),
                                            const SizedBox(height: 4),
                                            Row(
                                              children: [
                                                Expanded(
                                                  child: Text(c.lastMessage, maxLines: 1, overflow: TextOverflow.ellipsis,
                                                      style: const TextStyle(fontSize: 13, color: Color(0xFF3C4A42))),
                                                ),
                                                if (c.unreadCount > 0) ...[
                                                  const SizedBox(width: 8),
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                    decoration: BoxDecoration(
                                                      color: const Color(0xFFBA1A1A),
                                                      borderRadius: BorderRadius.circular(999),
                                                    ),
                                                    child: Text('${c.unreadCount}', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                                                  ),
                                                ],
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
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
