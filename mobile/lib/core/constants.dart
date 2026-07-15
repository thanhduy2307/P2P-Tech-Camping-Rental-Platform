class AppConstants {
  // Base URL of the VeloX backend API.
  // 10.0.2.2 is the loopback alias to the host machine for Android emulators.
  static const String apiBaseUrl =
      'http://10.0.2.2:5000/api';

  // Role constants matching the backend.
  static const String roleRenter = 'renter';
  static const String roleLender = 'lender';
  static const String roleInspector = 'inspector';
  static const String roleAdmin = 'admin';

  // Brand colors.
  static const int primaryColorValue = 0xFF2B6CB0;
  static const int accentColorValue = 0xFF38A169;
}
