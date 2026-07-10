import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class DriverRealtimeClient {
  static const String _wsUrl = String.fromEnvironment(
    'WS_URL',
    defaultValue: 'ws://10.0.2.2:4000/realtime',
  );
  static const String _tokenKey = 'cheetaxi.driver.accessToken';

  WebSocketChannel? _channel;
  final _storage = const FlutterSecureStorage();
  final StreamController<Map<String, dynamic>> _events = StreamController.broadcast();
  bool _connected = false;

  Stream<Map<String, dynamic>> get events => _events.stream;
  bool get isConnected => _connected;

  Future<void> connect() async {
    final token = await _storage.read(key: _tokenKey);
    if (token == null) return;
    final uri = Uri.parse('$_wsUrl?token=$token');
    _channel = WebSocketChannel.connect(uri);
    _connected = true;
    _channel!.stream.listen(
      (data) {
        try {
          _events.add(jsonDecode(data as String) as Map<String, dynamic>);
        } catch (_) {}
      },
      onError: (_) {
        _connected = false;
        Future.delayed(const Duration(seconds: 3), connect);
      },
      onDone: () {
        _connected = false;
        Future.delayed(const Duration(seconds: 3), connect);
      },
    );
  }

  void sendLocation(double lat, double lng, {double? heading, double? speed}) {
    _channel?.sink.add(jsonEncode({
      'event': 'driver:location',
      'data': {
        'latitude': lat, 'longitude': lng,
        'heading': heading, 'speedKmh': speed,
      },
    }));
  }

  void respondToOffer(String tripId, bool accept) {
    _channel?.sink.add(jsonEncode({
      'event': 'driver:offer:respond',
      'data': {'tripId': tripId, 'accept': accept},
    }));
  }

  void disconnect() {
    _channel?.sink.close();
    _channel = null;
    _connected = false;
  }
}
