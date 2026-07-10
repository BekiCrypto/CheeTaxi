import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class RideRequestSheet extends StatelessWidget {
  final Map<String, dynamic> trip;
  const RideRequestSheet({super.key, required this.trip});

  @override
  Widget build(BuildContext context) {
    final estimate = (trip['estimate'] ?? {}) as Map<String, dynamic>;
    final totalFare = estimate['totalFare'];
    final currency = estimate['currency'] ?? 'ETB';
    final distanceMeters = estimate['distanceMeters'];
    final durationSeconds = estimate['durationSeconds'];

    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 16,
        bottom: MediaQuery.of(context).padding.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(
              color: AppColors.ink200,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Row(
            children: [
              const Icon(Icons.search, color: AppColors.brand),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Finding your driver',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                    ),
                    Text(
                      'Trip ID: ${trip['publicId'] ?? trip['tripId']}',
                      style: const TextStyle(color: AppColors.ink400, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (totalFare != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.brand50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Estimated fare', style: TextStyle(color: AppColors.ink500, fontSize: 12)),
                      const SizedBox(height: 4),
                      Text(
                        '$currency $totalFare',
                        style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: AppColors.brand700),
                      ),
                    ],
                  ),
                  if (distanceMeters != null)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('${(distanceMeters / 1000).toStringAsFixed(1)} km'),
                        if (durationSeconds != null)
                          Text('${(durationSeconds / 60).round()} min', style: const TextStyle(color: AppColors.ink500, fontSize: 12)),
                      ],
                    ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
          OutlinedButton.icon(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.close),
            label: const Text('Cancel request'),
            style: OutlinedButton.styleFrom(foregroundColor: AppColors.danger),
          ),
        ],
      ),
    );
  }
}
