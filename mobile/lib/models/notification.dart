class AppNotification {
  final String id;
  final String type;
  final String title;
  final String message;
  final String? link;
  final bool isRead;
  final String createdAt;

  AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    this.link,
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['_id'] ?? json['id'] ?? '',
      type: json['type'] ?? 'SYSTEM',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      link: json['link'],
      isRead: json['isRead'] ?? false,
      createdAt: json['createdAt']?.toString() ?? '',
    );
  }
}
