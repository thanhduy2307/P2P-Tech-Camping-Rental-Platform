class Asset {
  final String id;
  final String name;
  final String description;
  final String category;
  final String? condition;
  final double pricePerDay;
  final double depositAmount;
  final String status;
  final List<String> images;
  final double? lat;
  final double? lng;
  final String? addressString;
  final String? lenderId;
  final String? lenderName;
  final String? lenderAvatar;
  final double? distance;
  final double? rating;
  final int? ratingCount;
  final List<String> badges;

  Asset({
    required this.id,
    required this.name,
    required this.description,
    required this.category,
    this.condition,
    required this.pricePerDay,
    required this.depositAmount,
    this.status = 'verified',
    this.images = const [],
    this.lat,
    this.lng,
    this.addressString,
    this.lenderId,
    this.lenderName,
    this.lenderAvatar,
    this.distance,
    this.rating,
    this.ratingCount,
    this.badges = const [],
  });

  factory Asset.fromJson(Map<String, dynamic> json) {
    final location = json['location'] as Map<String, dynamic>?;
    final lender = json['lender'] as Map<String, dynamic>?;
    return Asset(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      category: json['category'] ?? '',
      condition: json['condition'],
      pricePerDay: _toDouble(json['pricePerDay']),
      depositAmount: _toDouble(json['depositAmount']),
      status: json['status'] ?? 'verified',
      images: _toStringList(json['images']),
      lat: location != null ? _toDouble(location['lat']) : null,
      lng: location != null ? _toDouble(location['lng']) : null,
      addressString: location?['addressString'],
      lenderId: lender?['_id']?.toString(),
      lenderName: lender?['name'],
      lenderAvatar: lender?['avatar'],
      distance: json['distance'] != null
          ? (json['distance'] as num).toDouble()
          : null,
      rating: json['avgRating'] != null
          ? (json['avgRating'] as num).toDouble()
          : (json['rating'] != null ? (json['rating'] as num).toDouble() : null),
      ratingCount: json['ratingCount'] != null ? (json['ratingCount'] as num).toInt() : null,
      badges: _toStringList(json['badges']),
    );
  }

  static double _toDouble(dynamic v) =>
      (v is num) ? v.toDouble() : 0.0;

  static List<String> _toStringList(dynamic v) {
    if (v is List) return v.map((e) => e.toString()).toList();
    return [];
  }
}
