class Order {
  final String id;
  final String assetId;
  final String assetName;
  final String? assetImage;
  final String renterId;
  final String lenderId;
  final String startDate;
  final String endDate;
  final int rentalDays;
  final double totalRent;
  final double deposit;
  final String status;
  final String? handoverOTP;
  final String? returnOTP;

  Order({
    required this.id,
    required this.assetId,
    required this.assetName,
    this.assetImage,
    required this.renterId,
    required this.lenderId,
    required this.startDate,
    required this.endDate,
    required this.rentalDays,
    required this.totalRent,
    required this.deposit,
    required this.status,
    this.handoverOTP,
    this.returnOTP,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    final asset = json['asset'] as Map<String, dynamic>?;
    final renter = json['renter'] as Map<String, dynamic>?;
    final lender = json['lender'] as Map<String, dynamic>?;
    return Order(
      id: json['_id'] ?? json['id'] ?? '',
      assetId: asset?['_id'] ?? asset?['id'] ?? json['asset']?.toString() ?? '',
      assetName: asset?['name'] ?? 'Thiết bị',
      assetImage: asset?['images'] != null && (asset!['images'] as List).isNotEmpty
          ? (asset['images'] as List).first.toString()
          : null,
      renterId: renter?['_id'] ?? renter?['id'] ?? json['renter']?.toString() ?? '',
      lenderId:
          lender?['_id'] ?? lender?['id'] ?? json['lender']?.toString() ?? '',
      startDate: json['startDate']?.toString() ?? '',
      endDate: json['endDate']?.toString() ?? '',
      rentalDays: json['rentalDays'] ?? 0,
      totalRent: _toDouble(json['totalRent']),
      deposit: _toDouble(json['deposit']),
      status: json['status'] ?? '',
      handoverOTP: json['handoverOTP'],
      returnOTP: json['returnOTP'],
    );
  }

  static double _toDouble(dynamic v) => (v is num) ? v.toDouble() : 0.0;
}
