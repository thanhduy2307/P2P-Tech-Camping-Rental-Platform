import 'package:velox_mobile/core/api_client.dart';
import 'package:velox_mobile/models/message.dart';

class ChatService {
  static Future<Message> sendMessage({
    required String receiverId,
    required String content,
  }) async {
    final res = await ApiClient.post('/chats', {
      'receiver': receiverId,
      'content': content,
    });
    return Message.fromJson(res['data']);
  }

  static Future<List<Message>> getMessages(String peerId) async {
    final res = await ApiClient.get('/chats/$peerId');
    final list = res['data'] as List;
    return list.map((e) => Message.fromJson(e)).toList();
  }

  static Future<List<Conversation>> getConversations() async {
    final res = await ApiClient.get('/chats/conversations');
    final list = res['data'] as List;
    return list.map((e) => Conversation.fromJson(e)).toList();
  }

  static Future<void> markAsRead(String peerId) async {
    await ApiClient.put('/chats/read/$peerId', {});
  }
}
