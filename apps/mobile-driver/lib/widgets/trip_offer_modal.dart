import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Modal that pops up when a driver receives a trip offer.
/// Auto-dismisses after 15 seconds (matching the server offer TTL).
class TripOfferModal extends StatefulWidget {
  final Map<String, dynamic> offer;
  final void Function(bool accept) onRespond;
  const TripOfferModal({super.key, required this.offer, required this.onRespond});

  @override
  State<TripOfferModal> createState() => _TripOfferModalState();
}

class _TripOfferModalState extends State<TripOfferModal> with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;
  int _secondsLeft = 15;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
    Future.delayed(const Duration(seconds: 1), _tick);
  }

  void _tick() {
    if (!mounted) return;
    setState(() => _secondsLeft--);
    if (_secondsLeft <= 0) {
      widget.onRespond(false);
      Navigator.pop(context);
      return;
    }
    Future.delayed(const Duration(seconds: 1), _tick);
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pickup = widget.offer['pickupAddress'] as String? ?? '';
    final dropoff = widget.offer['dropoffAddress'] as String? ?? '';
    final fare = widget.offer['totalFare'] ?? widget.offer['fare'] ?? '0';
    final currency = widget.offer['currency'] ?? 'ETB';
    final distance = widget.offer['distanceMeters'];
    final eta = widget.offer['etaSeconds'];

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 24, right: 24, top: 20,
        bottom: MediaQuery.of(context).padding.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Pulsing header with countdown
          FadeTransition(
            opacity: _pulse,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.brand50,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'New trip request · $_secondsLeft s',
                textAlign: TextAlign.center,
                style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.brand700),
              ),
            ),
          ),
          const SizedBox(height: 20),
          // Fare
          Text('$currency $fare',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w800, color: AppColors.brand700)),
          const SizedBox(height: 4),
          if (distance != null && eta != null)
            Text(
              '${(distance / 1000).toStringAsFixed(1)} km away · ${((eta as num) / 60).round()} min',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.ink500),
            ),
          const SizedBox(height: 20),
          // Route
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.ink50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _routeRow(Icons.circle, AppColors.success, 'Pickup', pickup),
                const Padding(
                  padding: EdgeInsets.only(left: 11),
                  child: SizedBox(height: 16, child: VerticalDivider(color: AppColors.ink200, width: 1)),
                ),
                _routeRow(Icons.location_on, AppColors.danger, 'Dropoff', dropoff),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    widget.onRespond(false);
                    Navigator.pop(context);
                  },
                  icon: const Icon(Icons.close),
                  label: const Text('Decline'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.danger,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    widget.onRespond(true);
                    Navigator.pop(context);
                  },
                  icon: const Icon(Icons.check),
                  label: const Text('Accept'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.success,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _routeRow(IconData icon, Color color, String label, String address) {
    return Row(
      children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 11, color: AppColors.ink500)),
              Text(address, style: const TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ],
    );
  }
}
