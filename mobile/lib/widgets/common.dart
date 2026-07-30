import 'dart:convert';
import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:image_picker/image_picker.dart';
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
    } catch (_) {}
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

  static Future<List<String>> imagesToBase64(List<XFile> images) async {
    final results = <String>[];
    for (final img in images) {
      final ext = img.path.split('.').last.toLowerCase();
      final mime = ext == 'png' ? 'image/png' : 'image/jpeg';
      final file = File(img.path);
      final originalBytes = await file.readAsBytes();
      List<int> bytes;
      if (originalBytes.length > 500 * 1024) {
        final compressed = await FlutterImageCompress.compressWithFile(
          img.path,
          minWidth: 1024,
          minHeight: 1024,
          quality: 75,
        );
        bytes = compressed ?? originalBytes;
      } else {
        bytes = originalBytes;
      }
      results.add('data:$mime;base64,${base64Encode(bytes)}');
    }
    return results;
  }
}

class AssetImageWidget extends StatelessWidget {
  final String image;
  final double? width;
  final double? height;
  final BoxFit fit;
  final Widget? placehold;
  final Widget? errWidget;

  const AssetImageWidget({
    super.key,
    required this.image,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.placehold,
    this.errWidget,
  });

  @override
  Widget build(BuildContext context) {
    if (image.startsWith('data:')) {
      try {
        final parts = image.split(',');
        if (parts.length == 2) {
          final bytes = base64Decode(parts[1]);
          return Image.memory(bytes, width: width, height: height, fit: fit,
            errorBuilder: (_, __, ___) => _fallback(),
          );
        }
      } catch (_) {}
    }
    return CachedNetworkImage(
      imageUrl: image,
      width: width,
      height: height,
      fit: fit,
      placeholder: (_, __) => placehold ?? Container(color: Colors.grey[200]),
      errorWidget: (_, __, ___) => errWidget ?? _fallback(),
    );
  }

  Widget _fallback() {
    return Container(
      color: Colors.grey[200],
      child: const Icon(Icons.image, color: Colors.grey, size: 40),
    );
  }
}
