import 'package:dio/dio.dart';
import 'models.dart';

/// CheeTaxi API client.
class CheeTaxiClient {
  final Dio _dio;
  late final TripsResource trips;
  late final PricingResource pricing;
  late final SubscriptionsResource subscriptions;
  late final WalletsResource wallets;
  late final WebhooksResource webhooks;
  late final HealthResource health;

  CheeTaxiClient({
    required String baseUrl,
    String? accessToken,
    String? apiKey,
    Duration timeout = const Duration(seconds: 30),
  }) : _dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: timeout,
          receiveTimeout: timeout,
          headers: {
            'Content-Type': 'application/json',
            if (accessToken != null) 'Authorization': 'Bearer $accessToken',
            if (apiKey != null) 'X-API-Key': $apiKey,
          },
        )) {
    trips = TripsResource(_dio);
    pricing = PricingResource(_dio);
    subscriptions = SubscriptionsResource(_dio);
    wallets = WalletsResource(_dio);
    health = HealthResource(_dio);
    webhooks = WebhooksResource();
  }

  void setAccessToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  Future<T> _request<T>(String method, String path, {dynamic body, T Function(dynamic)? fromJson}) async {
    final response = await _dio.request<dynamic>(
      path,
      data: body,
      options: Options(method: method),
    );
    final data = response.data as Map<String, dynamic>;
    if (data['success'] != true) {
      throw CheeTaxiError(
        (data['error']?['message'] as String?) ?? 'Unknown error',
        response.statusCode ?? 0,
      );
    }
    final result = data['data'];
    return fromJson != null ? fromJson(result) : result as T;
  }
}

class CheeTaxiError implements Exception {
  final String message;
  final int statusCode;
  CheeTaxiError(this.message, this.statusCode);
  @override
  String toString() => 'CheeTaxiError($statusCode): $message';
}
