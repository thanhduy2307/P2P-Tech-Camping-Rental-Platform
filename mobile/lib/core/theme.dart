import 'package:flutter/material.dart';

class AppTheme {
  // EquipPeer brand palette (mirrored from web frontend)
  static const Color primary = Color(0xFF006C49);
  static const Color primaryContainer = Color(0xFF10B981);
  static const Color primaryFixed = Color(0xFF6FFBBE);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color onPrimaryContainer = Color(0xFF005236);

  static const Color secondary = Color(0xFF0058BE);
  static const Color secondaryContainer = Color(0xFF2170E4);
  static const Color onSecondary = Color(0xFFFFFFFF);

  static const Color background = Color(0xFFF8F9FF);
  static const Color surface = Color(0xFFF8F9FF);
  static const Color onSurface = Color(0xFF0B1C30);
  static const Color onSurfaceVariant = Color(0xFF3C4A42);

  static const Color outline = Color(0xFFBBCABF);
  static const Color outlineVariant = Color(0xFFBBCABF);

  static const Color error = Color(0xFFBA1A1A);
  static const Color onErrorContainer = Color(0xFF93000A);

  static const double radiusLg = 8.0;
  static const double radiusXl = 12.0;

  static const String fontDisplay = 'PlusJakartaSans';
  static const String fontBody = 'Inter';

  static ThemeData get light {
    final base = ColorScheme(
      brightness: Brightness.light,
      primary: primary,
      onPrimary: onPrimary,
      primaryContainer: primaryContainer,
      onPrimaryContainer: onPrimaryContainer,
      secondary: secondary,
      onSecondary: onSecondary,
      secondaryContainer: secondaryContainer,
      onSecondaryContainer: onPrimary,
      surface: surface,
      onSurface: onSurface,
      surfaceContainerHighest: const Color(0xFFEDF0EE),
      onSurfaceVariant: onSurfaceVariant,
      error: error,
      onError: const Color(0xFFFFFFFF),
      outline: outline,
      outlineVariant: outlineVariant,
    );

    final textTheme = TextTheme(
      displayLarge: const TextStyle(fontFamily: fontDisplay, color: onSurface, fontWeight: FontWeight.bold),
      displayMedium: const TextStyle(fontFamily: fontDisplay, color: onSurface, fontWeight: FontWeight.bold),
      displaySmall: const TextStyle(fontFamily: fontDisplay, color: onSurface, fontWeight: FontWeight.bold),
      headlineLarge: const TextStyle(fontFamily: fontDisplay, color: onSurface, fontWeight: FontWeight.bold),
      headlineMedium: const TextStyle(fontFamily: fontDisplay, color: onSurface, fontWeight: FontWeight.w700),
      headlineSmall: const TextStyle(fontFamily: fontDisplay, color: onSurface, fontWeight: FontWeight.w700),
      titleLarge: const TextStyle(fontFamily: fontDisplay, color: onSurface, fontWeight: FontWeight.w700),
      titleMedium: const TextStyle(fontFamily: fontDisplay, color: onSurface, fontWeight: FontWeight.w600),
      titleSmall: const TextStyle(fontFamily: fontDisplay, color: onSurface, fontWeight: FontWeight.w600),
      bodyLarge: const TextStyle(fontFamily: fontBody, color: onSurface),
      bodyMedium: const TextStyle(fontFamily: fontBody, color: onSurface),
      bodySmall: const TextStyle(fontFamily: fontBody, color: onSurfaceVariant),
      labelLarge: const TextStyle(fontFamily: fontBody, color: onSurface, fontWeight: FontWeight.w600),
      labelMedium: const TextStyle(fontFamily: fontBody, color: onSurfaceVariant),
      labelSmall: const TextStyle(fontFamily: fontBody, color: onSurfaceVariant),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: base,
      scaffoldBackgroundColor: background,
      textTheme: textTheme,
      fontFamily: fontBody,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        titleTextStyle: textTheme.titleLarge,
        iconTheme: const IconThemeData(color: onSurface),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF1F4F2),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusLg),
          borderSide: const BorderSide(color: outlineVariant),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusLg),
          borderSide: const BorderSide(color: outlineVariant),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusLg),
          borderSide: const BorderSide(color: secondaryContainer, width: 2),
        ),
        hintStyle: const TextStyle(fontFamily: fontBody, color: onSurfaceVariant),
        labelStyle: const TextStyle(fontFamily: fontBody, color: onSurfaceVariant),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: primaryContainer,
          foregroundColor: onPrimaryContainer,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusLg)),
          textStyle: const TextStyle(fontFamily: fontBody, fontWeight: FontWeight.w700, fontSize: 16),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryContainer,
          foregroundColor: onPrimaryContainer,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusLg)),
          textStyle: const TextStyle(fontFamily: fontBody, fontWeight: FontWeight.w700, fontSize: 16),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: secondary,
          textStyle: const TextStyle(fontFamily: fontBody, fontWeight: FontWeight.w600),
        ),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 2,
        shadowColor: const Color(0x1A0B1C30),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusXl),
          side: const BorderSide(color: Color(0x140B1C30)),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: const Color(0xFFEDF0EE),
        selectedColor: primaryFixed,
        labelStyle: const TextStyle(fontFamily: fontBody, color: onSurface),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
    );
  }
}
