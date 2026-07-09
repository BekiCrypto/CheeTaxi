import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../services/api_client.dart';
import '../theme/app_colors.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _online = false;
  bool _broadcasting = false;
  Map<String, dynamic>? _profile;
  Map<String, dynamic>? _earnings;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final profile = await DriverApiClient().getProfile();
    final earnings = await DriverApiClient().getEarnings(days: 7);
    if (mounted) {
      setState(() {
        _profile = profile;
        _earnings = earnings;
      });
    }
  }

  Future<void> _toggleOnline() async {
    final next = !_online;
    final ok = await DriverApiClient().setOnline(next);
    if (!mounted || !ok) return;
    setState(() => _online = next);
    if (next) {
      await DriverApiClient().startLocationBroadcast();
      setState(() => _broadcasting = true);
    } else {
      await DriverApiClient().stopLocationBroadcast();
      setState(() => _broadcasting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: const CameraPosition(target: LatLng(9.0195, 38.7525), zoom: 13),
            myLocationEnabled: true,
            myLocationButtonEnabled: true,
            trafficEnabled: true,
          ),
          // Top status bar
          Positioned(
            top: MediaQuery.of(context).padding.top + 12,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 12)],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: AppColors.brand100,
                    child: const Text('A', style: TextStyle(color: AppColors.brand700)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _profile?['user']?['firstName'] ?? 'Driver',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        Text(
                          _profile?['ratingAverage'] != null
                              ? '★ ${_profile!['ratingAverage'].toStringAsFixed(1)} · ${_profile!['completedTrips']} trips'
                              : 'New driver',
                          style: const TextStyle(color: AppColors.ink500, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _online ? AppColors.success.withOpacity(0.2) : AppColors.ink100,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _online ? 'ONLINE' : 'OFFLINE',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: _online ? AppColors.success : AppColors.ink500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Bottom: earnings + go online toggle
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_earnings != null) ...[
                      Row(
                        children: [
                          Expanded(
                            child: _stat('Today\'s earnings', 'Br ${_earnings!['grossEarnings']?.toStringAsFixed(0) ?? '0'}'),
                          ),
                          Expanded(
                            child: _stat('Trips (7d)', '${_earnings!['completedTrips'] ?? 0}'),
                          ),
                          Expanded(
                            child: _stat('Avg fare', 'Br ${_earnings!['avgFare']?.toStringAsFixed(0) ?? '0'}'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                    ],
                    ElevatedButton.icon(
                      onPressed: _toggleOnline,
                      icon: Icon(_online ? Icons.power_settings_new : Icons.flash_on),
                      label: Text(_online ? 'Go offline' : 'Go online & start earning'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _online ? AppColors.ink700 : AppColors.success,
                      ),
                    ),
                    if (_broadcasting) ...[
                      const SizedBox(height: 8),
                      const Center(
                        child: Text(
                          '📡 Broadcasting location',
                          style: TextStyle(fontSize: 11, color: AppColors.ink400),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _stat(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.ink500)),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
      ],
    );
  }
}
