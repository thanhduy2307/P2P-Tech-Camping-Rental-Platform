class User {
  final String id;
  final String name;
  final String? email;
  final String? phoneNumber;
  final String? avatar;
  final String? role;
  final bool isProfileCompleted;
  final String renterStatus;
  final String lenderStatus;
  final double reputationScore;
  final String? bio;
  final String? coverImage;
  final int ratingsCount;
  final double balance;
  final bool isBanned;
  final String? createdAt;
  final String? addressString;

  User({
    required this.id,
    required this.name,
    this.email,
    this.phoneNumber,
    this.avatar,
    this.role,
    this.isProfileCompleted = false,
    this.renterStatus = 'none',
    this.lenderStatus = 'none',
    this.reputationScore = 5.0,
    this.bio,
    this.coverImage,
    this.ratingsCount = 0,
    this.balance = 0.0,
    this.isBanned = false,
    this.createdAt,
    this.addressString,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    final address = json['address'] as Map<String, dynamic>?;
    return User(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'],
      phoneNumber: json['phoneNumber'],
      avatar: json['avatar'],
      role: json['role'],
      isProfileCompleted: json['isProfileCompleted'] ?? false,
      renterStatus: json['renterStatus'] ?? 'none',
      lenderStatus: json['lenderStatus'] ?? 'none',
      reputationScore:
          (json['reputationScore'] is num) ? json['reputationScore'].toDouble() : 5.0,
      bio: json['bio'],
      coverImage: json['coverImage'],
      ratingsCount: json['ratingsCount'] ?? 0,
      balance: (json['balance'] is num) ? (json['balance'] as num).toDouble() : 0.0,
      isBanned: json['isBanned'] == true,
      createdAt: json['createdAt']?.toString(),
      addressString: address != null
          ? '${address['street'] ?? ''}, ${address['ward'] ?? ''}'.trim()
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'name': name,
        'email': email,
        'phoneNumber': phoneNumber,
        'avatar': avatar,
        'role': role,
        'isProfileCompleted': isProfileCompleted,
        'renterStatus': renterStatus,
        'lenderStatus': lenderStatus,
        'reputationScore': reputationScore,
        'balance': balance,
        'isBanned': isBanned,
      };
}
