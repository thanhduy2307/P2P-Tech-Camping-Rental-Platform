import 'package:flutter/material.dart';
import 'package:velox_mobile/core/theme.dart';
import 'package:velox_mobile/widgets/equip_dialog.dart';

class UiHelper {
  static void showToast(BuildContext context, String message,
      {Color? color, IconData? icon}) {
    try {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              if (icon != null) ...[
                Icon(icon, color: Colors.white, size: 20),
                const SizedBox(width: 8),
              ],
              Expanded(
                child: Text(message,
                    style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w500)),
              ),
            ],
          ),
          backgroundColor: color ?? AppTheme.primaryContainer,
          behavior: SnackBarBehavior.floating,
          margin: const EdgeInsets.fromLTRB(16, 0, 16, 20),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12)),
          duration: const Duration(seconds: 3),
        ),
      );
    } catch (_) {
      // fallback: ignore if no scaffold available
    }
  }

  static void showErrorToast(BuildContext context, dynamic e) {
    showToast(context, e?.toString() ?? 'Có lỗi xảy ra',
        color: AppTheme.error, icon: Icons.error_outline_rounded);
  }

  static void showSuccessToast(BuildContext context, String message) {
    showToast(context, message,
        color: AppTheme.primaryContainer,
        icon: Icons.check_circle_outline_rounded);
  }

  static Future<void> showSuccessDialog(
          BuildContext context, String message) =>
      EquipDialog.success(context, message);

  static Future<void> showErrorDialog(
          BuildContext context, String message) =>
      EquipDialog.error(context, message);

  static Future<void> showInfoDialog(
          BuildContext context, String message) =>
      EquipDialog.info(context, message);

  static Future<bool?> showConfirmDialog(
          BuildContext context, String title, String message,
          {String confirmText = 'Xác nhận', String cancelText = 'Hủy'}) =>
      EquipDialog.confirm(context, title, message,
          confirmText: confirmText, cancelText: cancelText);

  static void showLoading(BuildContext context) =>
      EquipDialog.loading(context);

  static void hideLoading(BuildContext context) {
    try {
      Navigator.of(context, rootNavigator: true).pop();
    } catch (_) {}
  }

  static String formatVnd(double value) {
    return '${value.toInt().toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (m) => '${m[1]}.',
        )} đ';
  }

  static String initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts.last[0]).toUpperCase();
  }
}


