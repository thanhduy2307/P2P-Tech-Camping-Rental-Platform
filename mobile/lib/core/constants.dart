class AppConstants {
  // Base URL of the EquipPeer backend API (deployed on Oracle VPS).
  static const String apiBaseUrl =
      'http://150.136.248.214/api';

  // Role constants matching the backend.
  static const String roleRenter = 'renter';
  static const String roleLender = 'lender';
  static const String roleInspector = 'inspector';
  static const String roleAdmin = 'admin';

  // Brand colors (mirrored from web frontend).
  static const int primaryColorValue = 0xFF006C49;
  static const int accentColorValue = 0xFF10B981;
}
