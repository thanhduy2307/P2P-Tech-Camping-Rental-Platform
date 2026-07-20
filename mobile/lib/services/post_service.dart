import 'package:velox_mobile/core/api_client.dart';
import 'package:velox_mobile/models/notification.dart';
import 'package:velox_mobile/models/post.dart';

class PostService {
  static Future<List<Post>> getAllPosts() async {
    final res = await ApiClient.get('/posts');
    final list = res['data'] as List? ?? [];
    return list.map((e) => Post.fromJson(e)).toList();
  }

  static Future<Post> createPost(Map<String, dynamic> body) async {
    final res = await ApiClient.post('/posts', body);
    return Post.fromJson(res['data']);
  }

  static Future<Map<String, dynamic>> toggleLike(String id) async {
    final res = await ApiClient.post('/posts/$id/like', {});
    return res['data'];
  }

  static Future<Map<String, dynamic>> comment(String id, String content) async {
    final res = await ApiClient.post('/posts/$id/comment', {'content': content});
    return res['data'];
  }

  static Future<Map<String, dynamic>> generateAiContent(
      String assetId, String request) async {
    final res = await ApiClient.post('/posts/generate-ai-content', {
      'assetId': assetId,
      'userRequest': request,
    });
    return res['data'];
  }
}

class NotificationService {
  static Future<List<AppNotification>> getNotifications() async {
    final res = await ApiClient.get('/notifications');
    final list = res['data'] as List? ?? [];
    return list.map((e) => AppNotification.fromJson(e)).toList();
  }

  static Future<void> markRead(String id) async {
    await ApiClient.put('/notifications/$id/read', {});
  }

  static Future<void> markAllRead() async {
    await ApiClient.put('/notifications/read-all', {});
  }
}

