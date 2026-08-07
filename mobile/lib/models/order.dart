class Order {
  final String id;
  final String assetId;
  final String assetName;
  final String? assetImage;
  final String renterId;
  final String? renterName;
  final String lenderId;
  final String? lenderName;
  final String startDate;
  final String endDate;
  final int rentalDays;
  final double totalRent;
  final double deposit;
  final double platformFee;
  final String status;
  final String? handoverOTP;
  final String? returnOTP;
  final String? depositMethod;
  final List<String> handoverImages;
  final List<String> returnImages;
  final List<String> renterHandoverImages;
  final List<String> renterReturnImages;
  final String? disputeStatus;
  final String? disputeType;
  final String? disputeNotes;
  final int? extensionDays;
  final double? extensionRent;
  final String? extensionStatus;
  final int? lateDays;
  final double? lateFee;
  final int? renterRating;
  final String? renterComment;
  final int? lenderRating;
  final String? lenderComment;
  final double? actualCashDepositReturned;
  final String? cashDepositDeductionReason;

  Order({
    required this.id,
    required this.assetId,
    required this.assetName,
    this.assetImage,
    required this.renterId,
    this.renterName,
    required this.lenderId,
    this.lenderName,
    required this.startDate,
    required this.endDate,
    required this.rentalDays,
    required this.totalRent,
    required this.deposit,
    this.platformFee = 0,
    required this.status,
    this.handoverOTP,
    this.returnOTP,
    this.depositMethod,
    this.handoverImages = const [],
    this.returnImages = const [],
    this.renterHandoverImages = const [],
    this.renterReturnImages = const [],
    this.disputeStatus,
    this.disputeType,
    this.disputeNotes,
    this.extensionDays,
    this.extensionRent,
    this.extensionStatus,
    this.lateDays,
    this.lateFee,
    this.renterRating,
    this.renterComment,
    this.lenderRating,
    this.lenderComment,
    this.actualCashDepositReturned,
    this.cashDepositDeductionReason,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    final asset = _asMap(json['asset']);
    final renter = _asMap(json['renter']);
    final assetLender = _asMap(asset?['lender']);
    return Order(
      id: json['_id'] ?? json['id'] ?? '',
      assetId: asset?['_id'] ?? json['assetId'] ?? '',
      assetName: asset?['name'] ?? json['assetName'] ?? 'Thiết bị',
      assetImage: json['assetImage'] ??
          (asset?['images'] != null && (asset!['images'] as List).isNotEmpty
              ? (asset['images'] as List).first.toString()
              : null),
      renterId: renter?['_id'] ?? json['renterId'] ?? '',
      renterName: renter?['name'],
      lenderId: assetLender?['_id'] ?? json['lenderId'] ?? '',
      lenderName: assetLender?['name'],
      startDate: json['startDate']?.toString() ?? '',
      endDate: json['endDate']?.toString() ?? '',
      rentalDays: json['rentalDays'] ?? 0,
      totalRent: _toDouble(json['totalRent']),
      deposit: _toDouble(json['deposit']),
      platformFee: _toDouble(json['platformFee']),
      status: json['status'] ?? '',
      handoverOTP: json['handoverOTP'],
      returnOTP: json['returnOTP'],
      depositMethod: json['depositMethod'],
      handoverImages: _asListStr(json['handoverImages']),
      returnImages: _asListStr(json['returnImages']),
      renterHandoverImages: _asListStr(json['renterHandoverImages']),
      renterReturnImages: _asListStr(json['renterReturnImages']),
      disputeStatus: json['disputeStatus'],
      disputeType: json['disputeType'],
      disputeNotes: json['disputeNotes'],
      extensionDays: json['extensionDays'],
      extensionRent: _toDouble(json['extensionRent']),
      extensionStatus: json['extensionStatus'],
      lateDays: json['lateDays'],
      lateFee: _toDouble(json['lateFee']),
      renterRating: json['renterRating'],
      renterComment: json['renterComment'],
      lenderRating: json['lenderRating'],
      lenderComment: json['lenderComment'],
      actualCashDepositReturned: _toDouble(json['actualCashDepositReturned']),
      cashDepositDeductionReason: json['cashDepositDeductionReason'],
    );
  }

  static double _toDouble(dynamic v) => (v is num) ? v.toDouble() : 0.0;
  static Map<String, dynamic>? _asMap(dynamic v) =>
      (v is Map<String, dynamic>) ? v : null;
  static List<String> _asListStr(dynamic v) =>
      (v is List) ? v.map((e) => e.toString()).toList() : [];
}
