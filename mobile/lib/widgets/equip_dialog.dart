import 'dart:math';

import 'package:flutter/material.dart';
import 'package:velox_mobile/core/theme.dart';

class EquipDialog {
  static Future<void> success(BuildContext context, String message) =>
      _show(context, message, EquipDialogType.success);

  static Future<void> error(BuildContext context, String message) =>
      _show(context, message, EquipDialogType.error);

  static Future<void> info(BuildContext context, String message) =>
      _show(context, message, EquipDialogType.info);

  static Future<bool?> confirm(
      BuildContext context, String title, String message,
      {String confirmText = 'Xác nhận',
      String cancelText = 'Hủy'}) {
    return showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (_) => _EquipConfirmDialog(
        title: title,
        message: message,
        confirmText: confirmText,
        cancelText: cancelText,
      ),
    );
  }

  static void loading(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => WillPopScope(
        onWillPop: () async => false,
        child: const _EquipLoadingDialog(),
      ),
    );
  }

  static Future<void> _show(
      BuildContext context, String message, EquipDialogType type) {
    return showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: '',
      barrierColor: Colors.black.withValues(alpha: 0.5),
      transitionDuration: const Duration(milliseconds: 300),
      transitionBuilder: (ctx, animation, _, child) {
        return FadeTransition(
          opacity: animation,
          child: ScaleTransition(
            scale: CurvedAnimation(
                parent: animation, curve: Curves.easeOutBack),
            child: child,
          ),
        );
      },
      pageBuilder: (ctx, _, __) => _EquipDialog(type: type, message: message),
    );
  }
}

enum EquipDialogType { success, error, info }

class _EquipDialog extends StatelessWidget {
  final EquipDialogType type;
  final String message;

  const _EquipDialog({required this.type, required this.message});

  @override
  Widget build(BuildContext context) {
    final config = _config(type);
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 40),
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 32),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 40,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildIcon(config),
            const SizedBox(height: 20),
            Text(
              config.title,
              style: Theme.of(context)
                  .textTheme
                  .titleLarge
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.onSurfaceVariant,
                    height: 1.4,
                  ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => Navigator.pop(context),
                style: FilledButton.styleFrom(
                  backgroundColor: config.color,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Đã hiểu', style: TextStyle(fontSize: 15)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIcon(_DialogConfig c) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 500),
      curve: Curves.elasticOut,
      builder: (ctx, scale, _) {
        return Transform.scale(
          scale: scale,
          child: Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: c.color.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(c.icon, color: c.color, size: 36),
          ),
        );
      },
    );
  }

  _DialogConfig _config(EquipDialogType t) {
    switch (t) {
      case EquipDialogType.success:
        return _DialogConfig(
          Icons.check_circle_rounded,
          'Thành công',
          AppTheme.primaryContainer,
        );
      case EquipDialogType.error:
        return _DialogConfig(
          Icons.error_rounded,
          'Có lỗi xảy ra',
          AppTheme.error,
        );
      case EquipDialogType.info:
        return _DialogConfig(
          Icons.info_rounded,
          'Thông báo',
          AppTheme.secondary,
        );
    }
  }
}

class _DialogConfig {
  final IconData icon;
  final String title;
  final Color color;
  const _DialogConfig(this.icon, this.title, this.color);
}

class _EquipConfirmDialog extends StatelessWidget {
  final String title;
  final String message;
  final String confirmText;
  final String cancelText;

  const _EquipConfirmDialog({
    required this.title,
    required this.message,
    required this.confirmText,
    required this.cancelText,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 36),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 40,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppTheme.error.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.help_outline_rounded,
                  color: AppTheme.error, size: 28),
            ),
            const SizedBox(height: 16),
            Text(title,
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(message,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.onSurfaceVariant,
                      height: 1.4,
                    )),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context, false),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(cancelText),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: () => Navigator.pop(context, true),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppTheme.error,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(confirmText),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _EquipLoadingDialog extends StatefulWidget {
  const _EquipLoadingDialog();

  @override
  State<_EquipLoadingDialog> createState() => _EquipLoadingDialogState();
}

class _EquipLoadingDialogState extends State<_EquipLoadingDialog>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 30,
                offset: const Offset(0, 8)),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RotationTransition(
              turns: _controller,
              child: Icon(Icons.sync_rounded,
                  size: 48, color: AppTheme.primaryContainer),
            ),
            const SizedBox(height: 16),
            const Text('Đang xử lý...',
                style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.onSurface)),
          ],
        ),
      ),
    );
  }
}
