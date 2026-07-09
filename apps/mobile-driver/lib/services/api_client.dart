import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:geolocator/geolocator.dart';

class DriverApiClient {
  static const String _baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:4000',
  );
  static const String _tokenKey = 'cheetaxi.driver.accessToken';
  static const String _refreshKey = 'cheetaxi.driver.refreshToken';

  static final DriverApiClient _instance = DriverApiClient._();
  factory DriverApiClient() => _instance;

  late final Dio dio;
  final _storage = const FlutterSecureStorage();
  Timer? _locationTimer;

  DriverApiClient._() {
    dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: _tokenKey);
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
        return handler.next(options);
      },
      onError: (e, handler) async {
        if (e.response?.statusCode == 401) {
          final refreshed = await _refresh();
          if (refreshed) {
            final token = await _storage.read(key: _tokenKey);
            e.requestOptions.headers['Authorization'] = 'Bearer $token';
            return handler.resolve(await dio.fetch(e.requestOptions));
          }
        }
        return handler.next(e);
      },
    ));
  }

  Future<bool> requestOtp(String phone) async {
    try {
      await dio.post('/auth/otp/request', data: {'phone': phone, 'purpose': 'login'});
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> verifyOtp(String phone, String code) async {
    try {
      final res = await dio.post('/auth/otp/verify', data: {'phone': phone, 'code': code});
      final data = res.data['data'] as Map<String, dynamic>;
      await _storage.write(key: _tokenKey, value: data['accessToken'] as String);
      await _storage.write(key: _refreshKey, value: data['refreshToken'] as String);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<Map<String, dynamic>?> me() async {
    try {
      final res = await dio.get('/auth/me');
      return res.data['data'] as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> getProfile() async {
    try {
      final res = await dio.get('/drivers/me');
      return res.data['data'] as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  Future<bool> setOnline(bool online) async {
    try {
      await dio.post('/drivers/me/status', data: {'online': online});
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> updateLocation(double lat, double lng, {double? heading, double? speed}) async {
    try {
      await dio.post('/drivers/me/location', data: {
        'latitude': lat,
        'longitude': lng,
        'heading': heading,
        'speedKmh': speed,
      });
    } catch (e) {
      debugPrint('location update failed: $e');
    }
  }

  Future<bool> respondToOffer(String tripId, bool accept) async {
    try {
      await dio.post('/dispatch/respond', data: {'tripId': tripId, 'accept': accept});
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> arrive(String tripId) async {
    try {
      await dio.post('/trips/$tripId/arrive');
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> startTrip(String tripId) async {
    try {
      await dio.post('/trips/$tripId/start');
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> completeTrip(String tripId, {double? distance, int? duration}) async {
    try {
      await dio.post('/trips/$tripId/complete', data: {
        if (distance != null) 'actualDistanceMeters': distance,
        if (duration != null) 'actualDurationSeconds': duration,
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<Map<String, dynamic>?> getEarnings({int days = 7}) async {
    try {
      final res = await dio.get('/drivers/me/earnings?days=$days');
      return res.data['data'] as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  /// Start a background location broadcast loop.
  Future<void> startLocationBroadcast() async {
    _locationTimer?.cancel();
    _locationTimer = Timer.periodic(const Duration(seconds: 5), (_) async {
      try {
        final pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );
        await updateLocation(pos.latitude, pos.longitude, heading: pos.heading, speed: pos.speed);
      } catch (e) {
        debugPrint('location broadcast error: $e');
      }
    });
  }

  Future<void> stopLocationBroadcast() async {
    _locationTimer?.cancel();
    _locationTimer = null;
  }

  Future<void> logout() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _refreshKey);
  }

  Future<bool> _refresh() async {
    try {
      final refresh = await _storage.read(key: _refreshKey);
      if (refresh == null) return false;
      final res = await dio.post('/auth/refresh', data: {'refreshToken': refresh});
      final data = res.data['data'] as Map<String, dynamic>;
      await _storage.write(key: _tokenKey, value: data['accessToken'] as String);
      await _storage.write(key: _refreshKey, value: data['refreshToken'] as String);
      return true;
    } catch (_) {
      return false;
    }
  }
}
