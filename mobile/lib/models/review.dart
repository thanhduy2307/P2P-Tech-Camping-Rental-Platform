class Review {
  final String id;
  final int lenderRating;
  final String lenderComment;
  final DateTime createdAt;
  final String renterId;
  final String renterName;
  final String? renterAvatar;

  Review({
    required this.id,
    required this.lenderRating,
    required this.lenderComment,
    required this.createdAt,
    required this.renterId,
    required this.renterName,
    this.renterAvatar,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    final renter = json['renter'] as Map<String, dynamic>?;
    return Review(
      id: json['_id'] ?? json['id'] ?? '',
      lenderRating: json['lenderRating'] ?? 0,
      lenderComment: json['lenderComment'] ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      renterId: renter?['_id']?.toString() ?? '',
      renterName: renter?['name'] ?? '',
      renterAvatar: renter?['avatar'],
    );
  }
}
