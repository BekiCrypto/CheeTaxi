import 'package:dio/dio.dart';
import 'models.dart';

class TripsResource {
  final Dio _dio;
  TripsResource(this._dio);

  Future<TripRequestResult> request(TripRequestInput input) async {
    final res = await _dio.post('/trips/request', data: input.toJson());
    return TripRequestResult.fromJson(res.data['data']);
  }

  Future<Trip> get(String tripId) async {
    final res = await _dio.get('/trips/$tripId');
    return Trip.fromJson(res.data['data']);
  }

  Future<Trip> cancel(String tripId, String reason, {String by = 'passenger'}) async {
    final res = await _dio.post('/trips/$tripId/cancel', data: {'reason': reason, 'by': by});
    return Trip.fromJson(res.data['data']);
  }

  Future<Trip> accept(String tripId) async {
    final res = await _dio.post('/trips/$tripId/accept');
    return Trip.fromJson(res.data['data']);
  }

  Future<Trip> arrive(String tripId) async {
    final res = await _dio.post('/trips/$tripId/arrive');
    return Trip.fromJson(res.data['data']);
  }

  Future<Trip> start(String tripId) async {
    final res = await _dio.post('/trips/$tripId/start');
    return Trip.fromJson(res.data['data']);
  }

  Future<Trip> complete(String tripId, {double? actualDistanceMeters, int? actualDurationSeconds}) async {
    final res = await _dio.post('/trips/$tripId/complete', data: {
      if (actualDistanceMeters != null) 'actualDistanceMeters': actualDistanceMeters,
      if (actualDurationSeconds != null) 'actualDurationSeconds': actualDurationSeconds,
    });
    return Trip.fromJson(res.data['data']);
  }
}

class PricingResource {
  final Dio _dio;
  PricingResource(this._dio);

  Future<FareQuote> quote({
    required String vehicleType,
    required double pickupLat, required double pickupLng,
    required double dropoffLat, required double dropoffLng,
    String? pickupAddress, String? dropoffAddress,
    String? city, String? country, String? promoCode,
  }) async {
    final params = {
      'vehicleType': vehicleType,
      'pickupLat': pickupLat, 'pickupLng': pickupLng,
      'dropoffLat': dropoffLat, 'dropoffLng': dropoffLng,
      if (pickupAddress != null) 'pickupAddress': pickupAddress,
      if (dropoffAddress != null) 'dropoffAddress': dropoffAddress,
      if (city != null) 'city': city,
      if (country != null) 'country': country,
      if (promoCode != null) 'promoCode': promoCode,
    };
    final res = await _dio.get('/pricing/quote', queryParameters: params);
    return FareQuote.fromJson(res.data['data']);
  }

  Future<List<dynamic>> listTiers() async {
    final res = await _dio.get('/pricing/tiers');
    return res.data['data'] as List;
  }
}

class SubscriptionsResource {
  final Dio _dio;
  SubscriptionsResource(this._dio);

  Future<List<dynamic>> listPlans() async {
    final res = await _dio.get('/subscriptions/plans');
    return res.data['data'] as List;
  }

  Future<Map<String, dynamic>> getMyActive() async {
    final res = await _dio.get('/subscriptions/me/active');
    return res.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> purchase({
    required String planCode,
    required String paymentMethod,
    bool autoRenew = false,
    List<String>? driverIds,
  }) async {
    final res = await _dio.post('/subscriptions/purchase', data: {
      'planCode': planCode, 'paymentMethod': paymentMethod,
      'autoRenew': autoRenew, 'driverIds': driverIds,
    });
    return res.data['data'] as Map<String, dynamic>;
  }
}

class WalletsResource {
  final Dio _dio;
  WalletsResource(this._dio);

  Future<Wallet> getMyWallet() async {
    final res = await _dio.get('/wallets/me');
    return Wallet.fromJson(res.data['data']);
  }

  Future<void> topUp(double amount, String currency, String provider) async {
    await _dio.post('/wallets/me/topup', data: {
      'amount': amount, 'currency': currency, 'provider': provider,
    });
  }

  Future<Map<String, dynamic>> listTransactions({int page = 1, int limit = 20}) async {
    final res = await _dio.get('/wallets/me/transactions', queryParameters: {'page': page, 'limit': limit});
    return res.data['data'] as Map<String, dynamic>;
  }
}

class WebhooksResource {
  /// Verify a webhook signature.
  /// In Dart, use the `crypto` package:
  /// ```dart
  /// import 'dart:convert';
  /// import 'package:crypto/crypto.dart';
  ///
  /// bool verify(String body, String signature, String secret) {
  ///   final expected = hmac.convert(utf8.encode(body)).toString();
  ///   return expected == signature;
  /// }
  /// ```
  ///
  /// This stub is here for interface completeness. Implement in your app
  /// using the `crypto` package.
  bool verifySignature(String body, String signature, String secret) {
    throw UnimplementedError('Use crypto package: Hmac(sha256, utf8.encode(secret)).convert(utf8.encode(body))');
  }
}

class HealthResource {
  final Dio _dio;
  HealthResource(this._dio);

  Future<Map<String, dynamic>> liveness() async {
    final res = await _dio.get('/health');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> readiness() async {
    final res = await _dio.get('/health/ready');
    return res.data as Map<String, dynamic>;
  }
}
