import 'dart:async';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart' as p;
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';

import 'api_client.dart';

/// Offline-first local cache + sync queue for the driver app.
/// Mirrors the passenger app's OfflineStore but for driver-side concerns.
class DriverOfflineStore {
  static const _dbName = 'cheetaxi_driver.db';
  static const _dbVersion = 1;

  Database? _db;
  final _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _connSub;
  bool _isOnline = true;
  bool _syncing = false;

  bool get isOnline => _isOnline;
  final _onlineController = StreamController<bool>.broadcast();
  Stream<bool> get onOnlineChange => _onlineController.stream;

  Future<void> init() async {
    final dbPath = await getDatabasesPath();
    _db = await openDatabase(
      p.join(dbPath, _dbName),
      version: _dbVersion,
      onCreate: (db, v) async {
        await db.execute('''
          CREATE TABLE active_trip (
            id TEXT PRIMARY KEY,
            public_id TEXT,
            status TEXT,
            pickup_address TEXT,
            dropoff_address TEXT,
            total_fare REAL,
            currency TEXT,
            passenger_name TEXT,
            raw_json TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE earnings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL,
            currency TEXT,
            description TEXT,
            created_at TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE pending_ops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            method TEXT NOT NULL,
            path TEXT NOT NULL,
            body TEXT,
            queued_at TEXT NOT NULL,
            attempts INTEGER DEFAULT 0
          )
        ''');
        // Cache location updates for offline broadcasting
        await db.execute('''
          CREATE TABLE pending_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            heading REAL,
            speed REAL,
            recorded_at TEXT NOT NULL
          )
        ''');
      },
    );

    _connSub = _connectivity.onConnectivityChanged.listen((results) {
      final online = results.any((r) => r != ConnectivityResult.none);
      if (online != _isOnline) {
        _isOnline = online;
        _onlineController.add(online);
        if (online) {
          syncPending();
          flushPendingLocations();
        }
      }
    });

    final result = await _connectivity.checkConnectivity();
    _isOnline = result.any((r) => r != ConnectivityResult.none);
    if (_isOnline) syncPending();
  }

  /// Queue a location update when offline — will be batched and sent on reconnect.
  Future<void> queueLocation(double lat, double lng, {double? heading, double? speed}) async {
    if (_db == null) return;
    await _db!.insert('pending_locations', {
      'latitude': lat,
      'longitude': lng,
      'heading': heading,
      'speed': speed,
      'recorded_at': DateTime.now().toIso8601String(),
    });
  }

  /// Send all queued location updates (most recent first to avoid stale positions).
  Future<void> flushPendingLocations() async {
    if (!_isOnline || _db == null) return;
    final rows = await _db!.query('pending_locations', orderBy: 'recorded_at ASC', limit: 100);
    if (rows.isEmpty) return;

    // Only send the most recent — older positions are stale by definition
    final latest = rows.last;
    try {
      await DriverApiClient().updateLocation(
        latest['latitude'] as double,
        latest['longitude'] as double,
        heading: latest['heading'] as double?,
        speed: latest['speed'] as double?,
      );
      await _db!.delete('pending_locations');
    } catch (_) {
      // Will retry on next connectivity change
    }
  }

  Future<void> cacheActiveTrip(Map<String, dynamic> trip) async {
    if (_db == null) return;
    await _db!.insert('active_trip', {
      'id': trip['id'],
      'public_id': trip['publicId'],
      'status': trip['status'],
      'pickup_address': trip['pickupAddress'],
      'dropoff_address': trip['dropoffAddress'],
      'total_fare': (trip['totalFare'] as num?)?.toDouble(),
      'currency': trip['currency'],
      'passenger_name': trip['passenger']?['user']?['firstName'],
      'raw_json': trip.toString(),
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<Map<String, dynamic>?> getCachedActiveTrip() async {
    if (_db == null) return null;
    final rows = await _db!.query('active_trip', limit: 1);
    return rows.isEmpty ? null : rows.first;
  }

  Future<void> clearActiveTrip() async {
    if (_db == null) return;
    await _db!.delete('active_trip');
  }

  Future<int> enqueueOperation(String method, String path, {Map<String, dynamic>? body}) async {
    if (_db == null) return -1;
    return _db!.insert('pending_ops', {
      'method': method,
      'path': path,
      'body': body?.toString(),
      'queued_at': DateTime.now().toIso8601String(),
    });
  }

  Future<void> syncPending() async {
    if (!_isOnline || _syncing || _db == null) return;
    _syncing = true;
    try {
      final ops = await _db!.query('pending_ops', orderBy: 'queued_at ASC');
      for (final op in ops) {
        final id = op['id'] as int;
        try {
          final response = await DriverApiClient().dio.request(
            op['path'] as String,
            data: op['body'],
            options: Options(method: op['method'] as String),
          );
          if (response.statusCode != null && response.statusCode! < 400) {
            await _db!.delete('pending_ops', where: 'id = ?', whereArgs: [id]);
          }
        } catch (_) {
          break;
        }
      }
    } finally {
      _syncing = false;
    }
  }

  Future<void> close() async {
    await _connSub?.cancel();
    await _onlineController.close();
    await _db?.close();
  }
}
