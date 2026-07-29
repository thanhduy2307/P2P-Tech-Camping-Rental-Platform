class Post {
  final String id;
  final String authorId;
  final String authorName;
  final String? authorAvatar;
  final String title;
  final String content;
  final List<String> images;
  final int likesCount;
  final int commentsCount;
  final bool isLiked;
  final String createdAt;

  Post({
    required this.id,
    required this.authorId,
    required this.authorName,
    this.authorAvatar,
    required this.title,
    required this.content,
    this.images = const [],
    this.likesCount = 0,
    this.commentsCount = 0,
    this.isLiked = false,
    this.createdAt = '',
  });

  factory Post.fromJson(Map<String, dynamic> json) {
    final author = _asMap(json['author']);
    final likes = json['likes'];
    final comments = json['comments'];
    return Post(
      id: json['_id'] ?? json['id'] ?? '',
      authorId: author?['_id'] ?? author?['id'] ?? '',
      authorName: author?['name'] ?? 'Người dùng',
      authorAvatar: author?['avatar'],
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      images: _toStringList(json['images']),
      likesCount: likes is List ? likes.length : (json['likesCount'] ?? 0),
      commentsCount:
          comments is List ? comments.length : (json['commentsCount'] ?? 0),
      isLiked: json['isLiked'] ?? false,
      createdAt: json['createdAt']?.toString() ?? '',
    );
  }

  static List<String> _toStringList(dynamic v) {
    if (v is List) return v.map((e) => e.toString()).toList();
    return [];
  }

  static Map<String, dynamic>? _asMap(dynamic v) =>
      (v is Map<String, dynamic>) ? v : null;
}
