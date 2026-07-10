/// CheeTaxi Dart SDK — official client for the CheeTaxi REST API.
///
/// Usage:
/// ```dart
/// import 'package:cheetaxi/cheetaxi.dart';
///
/// final client = CheeTaxiClient(
///   baseUrl: 'https://api.cheetaxi.africa',
///   accessToken: 'your-jwt',
/// );
///
/// final trip = await client.trips.request(
///   pickup: GeoPoint(lat: 9.0195, lng: 38.7525, address: 'Bole'),
///   dropoff: GeoPoint(lat: 9.0112, lng: 38.7623, address: 'Meskel'),
///   mode: 'TAXI',
///   vehicleType: 'TAXI',
///   paymentMethod: 'CASH',
/// );
/// ```
library cheetaxi;

export 'src/client.dart';
export 'src/resources.dart';
export 'src/models.dart';
