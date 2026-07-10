import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../services/api_client.dart';
import '../theme/app_colors.dart';
import 'ride_request_sheet.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  GoogleMapController? _mapController;
  LatLng? _pickup;
  final _api = ApiClient();
  String? _pickupAddress;

  static const _addisAbaba = LatLng(9.0195, 38.7525);

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  Future<void> _initLocation() async {
    final service = await Geolocator.isLocationServiceEnabled();
    if (!service) return;
    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }
    if (perm == LocationPermission.deniedForever) return;
    final pos = await Geolocator.getCurrentPosition();
    if (!mounted) return;
    setState(() {
      _pickup = LatLng(pos.latitude, pos.longitude);
      _pickupAddress = 'Current location';
    });
    _mapController?.animateCamera(CameraUpdate.newLatLngZoom(_pickup!, 15));
  }

  Future<void> _requestRide() async {
    if (_pickup == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Locating you… please wait.')),
      );
      return;
    }
    // For demo — dropoff is set to airport. Real impl: search places UI.
    final dropoff = const LatLng(8.9779, 38.7993);
    final trip = await _api.requestTrip(
      pickupLat: _pickup!.latitude,
      pickupLng: _pickup!.longitude,
      pickupAddress: _pickupAddress,
      dropoffLat: dropoff.latitude,
      dropoffLng: dropoff.longitude,
      dropoffAddress: 'Bole International Airport',
      mode: 'TAXI',
      vehicleType: 'TAXI',
      paymentMethod: 'CASH',
    );
    if (trip != null && mounted) {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        builder: (_) => RideRequestSheet(trip: trip),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: const CameraPosition(target: _addisAbaba, zoom: 13),
            myLocationEnabled: true,
            myLocationButtonEnabled: true,
            onMapCreated: (c) => _mapController = c,
            markers: _pickup != null
                ? {Marker(markerId: const MarkerId('pickup'), position: _pickup!)}
                : {},
          ),
          // Top search bar
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
                children: const [
                  Icon(Icons.search, color: AppColors.ink400),
                  SizedBox(width: 12),
                  Text('Where to?', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
                ],
              ),
            ),
          ),
          // Bottom ride modes
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
                    const Text(
                      'Choose a ride',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _modeChip('🚕', 'Taxi', true),
                        _modeChip('🏍️', 'Moto', false),
                        _modeChip('🛺', 'Bajaj', false),
                        _modeChip('📦', 'Parcel', false),
                      ],
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: _requestRide,
                      icon: const Icon(Icons.navigation_outlined),
                      label: const Text('Request ride'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _modeChip(String emoji, String label, bool selected) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected ? AppColors.brand50 : AppColors.ink50,
          border: Border.all(
            color: selected ? AppColors.brand : AppColors.ink100,
            width: selected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 24)),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: selected ? AppColors.brand700 : AppColors.ink600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
