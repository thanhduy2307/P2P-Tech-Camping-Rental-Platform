import 'package:flutter/material.dart';
import '../core/theme.dart';

class BrandLogo extends StatelessWidget {
  final double size;
  final bool withName;

  const BrandLogo({super.key, this.size = 28, this.withName = true});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size + 12,
          height: size + 12,
          decoration: BoxDecoration(
            color: AppTheme.primary,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(Icons.explore, color: Colors.white, size: size),
        ),
        if (withName) ...[
          const SizedBox(width: 10),
          Text(
            'EquipPeer',
            style: TextStyle(
              fontFamily: 'PlusJakartaSans',
              fontWeight: FontWeight.w800,
              fontSize: size * 0.85,
              color: AppTheme.onSurface,
            ),
          ),
        ],
      ],
    );
  }
}
