import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  static const String _baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:4000', // Android emulator → host
  );
  static const String _tokenKey = 'cheetaxi.accessToken';
  static const String _refreshKey = 'cheetaxi.refreshToken';

  static final ApiClient _instance = ApiClient._();
  factory ApiClient() => _instance;

  late final Dio dio;
  final _storage = const FlutterSecureStorage();

  ApiClient._() {
    dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: _tokenKey);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (e, handler) async {
        if (e.response?.statusCode == 401) {
          // Try refresh
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

  Future<bool> login(String identifier, String password) async {
    try {
      final res = await dio.post('/auth/login', data: {
        'identifier': identifier,
        'password': password,
      });
      final data = res.data['data'] as Map<String, dynamic>;
      await _storage.write(key: _tokenKey, value: data['accessToken'] as String);
      await _storage.write(key: _refreshKey, value: data['refreshToken'] as String);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> requestOtp(String phone) async {
    try {
      await dio.post('/auth/otp/request', data: {'phone': phone});
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> verifyOtp(String phone, String code, {String? firstName, String? lastName}) async {
    try {
      final res = await dio.post('/auth/otp/verify', data: {
        'phone': phone,
        'code': code,
        if (firstName != null) 'firstName': firstName,
        if (lastName != null) 'lastName': lastName,
      });
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

  Future<Map<String, dynamic>?> requestTrip({
    required double pickupLat,
    required double pickupLng,
    required double dropoffLat,
    required double dropoffLng,
    String? pickupAddress,
    String? dropoffAddress,
    String mode = 'TAXI',
    String vehicleType = 'TAXI',
    String paymentMethod = 'CASH',
  }) async {
    try {
      final res = await dio.post('/trips/request', data: {
        'pickup': {'lat': pickupLat, 'lng': pickupLng, 'address': pickupAddress},
        'dropoff': {'lat': dropoffLat, 'lng': dropoffLng, 'address': dropoffAddress},
        'mode': mode,
        'vehicleType': vehicleType,
        'paymentMethod': paymentMethod,
      });
      return res.data['data'] as Map<String, dynamic>?;
    } catch (e) {
      debugPrint('requestTrip error: $e');
      return null;
    }
  }

  Future<void> cancelTrip(String tripId, String reason) async {
    await dio.post('/trips/$tripId/cancel', data: {'reason': reason, 'by': 'passenger'});
  }

  Future<void> rateTrip(String tripId, int stars, {String? comment}) async {
    await dio.post('/ratings/trips/$tripId', data: {
      'role': 'PASSENGER_TO_DRIVER',
      'stars': stars,
      'comment': comment,
    });
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
