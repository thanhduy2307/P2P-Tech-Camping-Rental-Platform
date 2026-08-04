import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:velox_mobile/models/asset.dart';
import 'package:velox_mobile/widgets/common.dart';

class AssetCard extends StatelessWidget {
  final Asset asset;
  final VoidCallback onTap;

  const AssetCard({super.key, required this.asset, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
              child: AspectRatio(
                aspectRatio: 1.3,
                child: asset.images.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: asset.images.first,
                        fit: BoxFit.cover,
                        placeholder: (_, __) => Container(color: Colors.grey[200]),
                        errorWidget: (_, __, ___) => Container(
                            color: Colors.grey[200], child: const Icon(Icons.image, color: Colors.grey)),
                      )
                    : Container(color: Colors.grey[200], child: const Icon(Icons.image, color: Colors.grey)),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      asset.category,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF006C49),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(asset.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, fontFamily: 'PlusJakartaSans')),
                  const SizedBox(height: 8),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        UiHelper.formatVnd(asset.pricePerDay),
                        style: const TextStyle(
                          color: Color(0xFF006C49),
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                        ),
                      ),
                      const Text(' / ngày', style: TextStyle(fontSize: 11, color: Color(0xFF3C4A42))),
                      const Spacer(),
                      if (asset.rating != null)
                        Row(
                          children: [
                            const Icon(Icons.star, size: 14, color: Color(0xFF0058BE)),
                            const SizedBox(width: 2),
                            Text(asset.rating!.toStringAsFixed(1),
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                          ],
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
