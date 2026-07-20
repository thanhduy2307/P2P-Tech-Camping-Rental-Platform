class Message {
  final String id;
  final String senderId;
  final String receiverId;
  final String content;
  final bool isRead;
  final String createdAt;

  Message({
    required this.id,
    required this.senderId,
    required this.receiverId,
    required this.content,
    required this.isRead,
    required this.createdAt,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['_id'] ?? json['id'] ?? '',
      senderId: json['sender'] is Map
          ? (json['sender']['_id'] ?? json['sender']['id']).toString()
          : json['sender'].toString(),
      receiverId: json['receiver'] is Map
          ? (json['receiver']['_id'] ?? json['receiver']['id']).toString()
          : json['receiver'].toString(),
      content: json['content'] ?? '',
      isRead: json['isRead'] ?? false,
      createdAt: json['createdAt']?.toString() ?? '',
    );
  }
}

class Conversation {
  final String peerId;
  final String peerName;
  final String lastMessage;
  final int unreadCount;
  final String updatedAt;

  Conversation({
    required this.peerId,
    required this.peerName,
    required this.lastMessage,
    required this.unreadCount,
    required this.updatedAt,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    final user = json['user'];
    final lastMsg = json['lastMessage'];
    final lastContent = (lastMsg is Map<String, dynamic>)
        ? (lastMsg['content']?.toString() ?? '')
        : (lastMsg?.toString() ?? '');
    final userName = (user is Map<String, dynamic>)
        ? (user['name']?.toString() ?? 'Người dùng')
        : 'Người dùng';
    final userId = (user is Map<String, dynamic>)
        ? (user['_id']?.toString() ?? '')
        : (user?.toString() ?? '');
    return Conversation(
      peerId: userId,
      peerName: userName,
      lastMessage: lastContent,
      unreadCount: json['unreadCount'] ?? 0,
      updatedAt: json['updatedAt']?.toString() ?? '',
    );
  }
}
