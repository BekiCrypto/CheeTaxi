import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Realtime WebSocket client for the CheeTaxi passenger app.
///
/// Connects to wss://api.cheetaxi.africa/realtime with the user's JWT.
/// Emits typed events for: driver location, trip status changes,
/// notifications, wallet updates, and SOS alerts.
class RealtimeClient {
  static const String _wsUrl = String.fromEnvironment(
    'WS_URL',
    defaultValue: 'ws://10.0.2.2:4000/realtime',
  );
  static const String _tokenKey = 'cheetaxi.accessToken';

  WebSocketChannel? _channel;
  final _storage = const FlutterSecureStorage();
  final StreamController<RealtimeEvent> _events = StreamController.broadcast();
  bool _connected = false;

  Stream<RealtimeEvent> get events => _events.stream;
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
          final json = jsonDecode(data as String) as Map<String, dynamic>;
          final event = RealtimeEvent.fromJson(json);
          _events.add(event);
        } catch (_) {
          // ignore malformed
        }
      },
      onError: (e) {
        _connected = false;
        // Auto-reconnect after 3 seconds
        Future.delayed(const Duration(seconds: 3), connect);
      },
      onDone: () {
        _connected = false;
        Future.delayed(const Duration(seconds: 3), connect);
      },
    );
  }

  void subscribeToTrip(String tripId) {
    _channel?.sink.add(jsonEncode({'event': 'trip:subscribe', 'data': {'tripId': tripId}}));
  }

  void unsubscribeFromTrip(String tripId) {
    _channel?.sink.add(jsonEncode({'event': 'trip:unsubscribe', 'data': {'tripId': tripId}}));
  }

  void disconnect() {
    _channel?.sink.close();
    _channel = null;
    _connected = false;
  }
}

/// A typed event received from the server.
class RealtimeEvent {
  final String name;
  final Map<String, dynamic> payload;

  const RealtimeEvent({required this.name, required this.payload});

  factory RealtimeEvent.fromJson(Map<String, dynamic> json) {
    return RealtimeEvent(
      name: json['event'] as String? ?? '',
      payload: (json['data'] as Map<String, dynamic>?) ?? json,
    );
  }
}
