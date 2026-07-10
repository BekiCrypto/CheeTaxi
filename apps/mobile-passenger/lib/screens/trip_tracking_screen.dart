import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../services/api_client.dart';
import '../services/realtime_client.dart';
import '../theme/app_colors.dart';
import 'rating_screen.dart';

class TripTrackingScreen extends StatefulWidget {
  final String tripId;
  const TripTrackingScreen({super.key, required this.tripId});

  @override
  State<TripTrackingScreen> createState() => _TripTrackingScreenState();
}

class _TripTrackingScreenState extends State<TripTrackingScreen> {
  Map<String, dynamic>? _trip;
  Marker? _driverMarker;
  final _realtime = RealtimeClient();
  StreamSubscription? _eventSub;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final trip = await ApiClient().dio.get('/trips/${widget.tripId}');
    if (!mounted) return;
    setState(() {
      _trip = trip.data['data'] as Map<String, dynamic>?;
      _loading = false;
    });
    await _realtime.connect();
    _realtime.subscribeToTrip(widget.tripId);
    _eventSub = _realtime.events.listen(_handleEvent);
  }

  void _handleEvent(RealtimeEvent event) {
    if (!mounted) return;
    switch (event.name) {
      case 'driver.location':
        final lat = event.payload['latitude'] as num;
        final lng = event.payload['longitude'] as num;
        setState(() {
          _driverMarker = Marker(
            markerId: const MarkerId('driver'),
            position: LatLng(lat.toDouble(), lng.toDouble()),
            icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
          );
        });
        break;
      case 'trip.assigned':
        _refresh();
        break;
      case 'trip.arrived':
        _refresh();
        _showSnackBar('Your driver has arrived');
        break;
      case 'trip.started':
        _refresh();
        _showSnackBar('Trip started');
        break;
      case 'trip.completed':
        _realtime.unsubscribeFromTrip(widget.tripId);
        Navigator.of(context).pushReplacement(MaterialPageRoute(
          builder: (_) => RatingScreen(tripId: widget.tripId),
        ));
        break;
      case 'trip.cancelled':
        Navigator.of(context).pop();
        break;
    }
  }

  Future<void> _refresh() async {
    final res = await ApiClient().dio.get('/trips/${widget.tripId}');
    if (mounted) setState(() => _trip = res.data['data'] as Map<String, dynamic>?);
  }

  void _showSnackBar(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  void dispose() {
    _eventSub?.cancel();
    _realtime.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || _trip == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final status = _trip!['status'] as String? ?? 'UNKNOWN';
    final driver = _trip!['driver'] as Map<String, dynamic>?;
    final vehicle = driver?['currentVehicle'] as Map<String, dynamic>?;
    final pickup = LatLng(
      (_trip!['pickupLatitude'] as num).toDouble(),
      (_trip!['pickupLongitude'] as num).toDouble(),
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Your trip')),
      body: Column(
        children: [
          Expanded(
            child: GoogleMap(
              initialCameraPosition: CameraPosition(target: pickup, zoom: 15),
              markers: {
                Marker(markerId: const MarkerId('pickup'), position: pickup),
                if (_driverMarker != null) _driverMarker!,
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: SafeArea(
              top: false,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      _statusIcon(status),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_statusText(status),
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                            Text('${_trip!['pickupAddress']} → ${_trip!['dropoffAddress']}',
                              style: const TextStyle(color: AppColors.ink500, fontSize: 13)),
                          ],
                        ),
                      ),
                      Text('${_trip!['currency']} ${_trip!['totalFare']}',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.brand700)),
                    ],
                  ),
                  if (driver != null) ...[
                    const SizedBox(height: 20),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.ink50,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: AppColors.brand100,
                            child: Text(
                              '${driver['user']?['firstName']?[0] ?? '?'}',
                              style: const TextStyle(color: AppColors.brand700),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('${driver['user']?['firstName']} ${driver['user']?['lastName']}',
                                  style: const TextStyle(fontWeight: FontWeight.w600)),
                                if (vehicle != null)
                                  Text('${vehicle['make']} ${vehicle['model']} · ${vehicle['plateNumber']}',
                                    style: const TextStyle(color: AppColors.ink500, fontSize: 13)),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () {/* launch phone */},
                            icon: const Icon(Icons.phone, color: AppColors.brand),
                          ),
                          IconButton(
                            onPressed: () {/* SOS */},
                            icon: const Icon(Icons.emergency, color: AppColors.danger),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  if (status == 'DRIVER_ASSIGNED' || status == 'DRIVER_ARRIVING')
                    OutlinedButton.icon(
                      onPressed: () async {
                        await ApiClient().cancelTrip(widget.tripId, 'passenger_cancelled');
                        if (context.mounted) Navigator.pop(context);
                      },
                      icon: const Icon(Icons.close),
                      label: const Text('Cancel trip'),
                      style: OutlinedButton.styleFrom(foregroundColor: AppColors.danger),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statusIcon(String status) {
    IconData icon;
    Color color;
    switch (status) {
      case 'DRIVER_ASSIGNED':
      case 'DRIVER_ARRIVING':
        icon = Icons.directions_car; color = AppColors.brand; break;
      case 'DRIVER_ARRIVED':
        icon = Icons.location_on; color = AppColors.success; break;
      case 'IN_PROGRESS':
        icon = Icons.navigation; color = AppColors.brand; break;
      case 'COMPLETED':
        icon = Icons.check_circle; color = AppColors.success; break;
      case 'CANCELLED_BY_PASSENGER':
      case 'CANCELLED_BY_DRIVER':
      case 'CANCELLED_BY_SYSTEM':
        icon = Icons.cancel; color = AppColors.danger; break;
      default:
        icon = Icons.access_time; color = AppColors.ink400;
    }
    return CircleAvatar(backgroundColor: color.withOpacity(0.15), child: Icon(icon, color: color));
  }

  String _statusText(String status) {
    const map = {
      'REQUESTED': 'Finding your driver...',
      'SEARCHING': 'Finding your driver...',
      'DRIVER_ASSIGNED': 'Driver on the way',
      'DRIVER_ARRIVING': 'Driver on the way',
      'DRIVER_ARRIVED': 'Driver has arrived',
      'IN_PROGRESS': 'On the way to destination',
      'COMPLETED': 'Trip completed',
      'CANCELLED_BY_PASSENGER': 'Trip cancelled',
      'CANCELLED_BY_DRIVER': 'Driver cancelled',
      'CANCELLED_BY_SYSTEM': 'Trip cancelled',
      'NO_DRIVER_FOUND': 'No driver found',
    };
    return map[status] ?? status;
  }
}
