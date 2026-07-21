import 'package:flutter/material.dart';
import 'package:velox_mobile/core/theme.dart';
import 'package:velox_mobile/widgets/equip_dialog.dart';

class UiHelper {
  static void showToast(BuildContext context, String message,
      {Color? color, IconData? icon}) {
    final overlay = Overlay.of(context);
    late OverlayEntry entry;
    entry = OverlayEntry(
      builder: (_) => _EquipToast(
        message: message,
        color: color,
        icon: icon,
        onDismiss: () => entry.remove(),
      ),
    );
    overlay.insert(entry);
    Future.delayed(const Duration(seconds: 3), () {
      if (entry.mounted) entry.remove();
    });
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
    Navigator.of(context, rootNavigator: true).pop();
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

class _EquipToast extends StatefulWidget {
  final String message;
  final Color? color;
  final IconData? icon;
  final VoidCallback onDismiss;

  const _EquipToast({
    required this.message,
    this.color,
    this.icon,
    required this.onDismiss,
  });

  @override
  State<_EquipToast> createState() => _EquipToastState();
}

class _EquipToastState extends State<_EquipToast>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _slide;
  late Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _slide = Tween<Offset>(
            begin: const Offset(0, -0.3), end: Offset.zero)
        .animate(CurvedAnimation(
            parent: _controller, curve: Curves.easeOutCubic));
    _fade = Tween<double>(begin: 0, end: 1).animate(_controller);
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void dismiss() {
    _controller.reverse().then((_) => widget.onDismiss());
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.color ?? AppTheme.primaryContainer;
    return Positioned(
      top: MediaQuery.of(context).padding.top + 60,
      left: 16,
      right: 16,
      child: SlideTransition(
        position: _slide,
        child: FadeTransition(
          opacity: _fade,
          child: Material(
            color: Colors.transparent,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: color.withValues(alpha: 0.2),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
                border: Border(left: BorderSide(color: color, width: 4)),
              ),
              child: Row(
                children: [
                  if (widget.icon != null) ...[
                    Icon(widget.icon, color: color, size: 22),
                    const SizedBox(width: 10),
                  ],
                  Expanded(
                    child: Text(widget.message,
                        style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: AppTheme.onSurface)),
                  ),
                  GestureDetector(
                    onTap: dismiss,
                    child: Icon(Icons.close, size: 18,
                        color: AppTheme.onSurfaceVariant),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
