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
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Row(
          children: [
            ClipRRect(
              borderRadius:
                  const BorderRadius.horizontal(left: Radius.circular(12)),
              child: asset.images.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: asset.images.first,
                      width: 110,
                      height: 110,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(
                          width: 110,
                          height: 110,
                          color: Colors.grey[200]),
                      errorWidget: (_, __, ___) => Container(
                          width: 110,
                          height: 110,
                          color: Colors.grey[200],
                          child: const Icon(Icons.image)),
                    )
                  : Container(
                      width: 110,
                      height: 110,
                      color: Colors.grey[200],
                      child: const Icon(Icons.image)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(asset.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 4),
                    Text(asset.category,
                        style: TextStyle(
                            color: Colors.grey[600], fontSize: 12)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Text(
                          UiHelper.formatVnd(asset.pricePerDay),
                          style: const TextStyle(
                              color: Colors.green,
                              fontWeight: FontWeight.w600),
                        ),
                        const Text(' / ngày',
                            style: TextStyle(fontSize: 12)),
                      ],
                    ),
                    if (asset.distance != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          'Cách ${asset.distance!.toStringAsFixed(1)} km',
                          style: const TextStyle(
                              fontSize: 12, color: Colors.blue),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
