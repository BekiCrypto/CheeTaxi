import 'dart:async';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart' as p;
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';

import 'api_client.dart';

/// Offline-first local cache + sync queue.
///
/// Stores:
///   • trips         — recent trips (cached for offline viewing)
///   • notifications — notification inbox
///   • pending_ops   — queued mutations (POST/PUT/DELETE) to sync when online
///
/// On app start, calls #syncPending() which replays the queue.
class OfflineStore {
  static const _dbName = 'cheetaxi.db';
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
          CREATE TABLE trips (
            id TEXT PRIMARY KEY,
            public_id TEXT,
            status TEXT,
            pickup_address TEXT,
            dropoff_address TEXT,
            total_fare REAL,
            currency TEXT,
            requested_at TEXT,
            completed_at TEXT,
            raw_json TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE notifications (
            id TEXT PRIMARY KEY,
            title TEXT,
            body TEXT,
            channel TEXT,
            code TEXT,
            created_at TEXT,
            read_at TEXT
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
        await db.execute('CREATE INDEX idx_pending_ops_queued ON pending_ops(queued_at)');
      },
    );

    _connSub = _connectivity.onConnectivityChanged.listen((results) {
      final online = results.any((r) => r != ConnectivityResult.none);
      if (online != _isOnline) {
        _isOnline = online;
        _onlineController.add(online);
        if (online) syncPending();
      }
    });

    // Initial connectivity check
    final result = await _connectivity.checkConnectivity();
    _isOnline = result.any((r) => r != ConnectivityResult.none);
    if (_isOnline) syncPending();
  }

  // ─── Cache read/write ────────────────────────────────────────────────────

  Future<void> cacheTrip(Map<String, dynamic> trip) async {
    if (_db == null) return;
    await _db!.insert(
      'trips',
      {
        'id': trip['id'],
        'public_id': trip['publicId'],
        'status': trip['status'],
        'pickup_address': trip['pickupAddress'],
        'dropoff_address': trip['dropoffAddress'],
        'total_fare': (trip['totalFare'] as num?)?.toDouble(),
        'currency': trip['currency'],
        'requested_at': trip['requestedAt'],
        'completed_at': trip['completedAt'],
        'raw_json': trip.toString(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<Map<String, dynamic>>> getCachedTrips({int limit = 20}) async {
    if (_db == null) return [];
    return _db!.query('trips', orderBy: 'requested_at DESC', limit: limit);
  }

  Future<void> cacheNotification(Map<String, dynamic> n) async {
    if (_db == null) return;
    await _db!.insert(
      'notifications',
      {
        'id': n['id'],
        'title': n['title'],
        'body': n['body'],
        'channel': n['channel'],
        'code': n['code'],
        'created_at': n['createdAt'],
        'read_at': n['readAt'],
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<Map<String, dynamic>>> getCachedNotifications({int limit = 20}) async {
    if (_db == null) return [];
    return _db!.query('notifications', orderBy: 'created_at DESC', limit: limit);
  }

  // ─── Pending operations queue ────────────────────────────────────────────

  /// Queue a mutation to be replayed when back online.
  Future<int> enqueueOperation(String method, String path, {Map<String, dynamic>? body}) async {
    if (_db == null) return -1;
    return _db!.insert('pending_ops', {
      'method': method,
      'path': path,
      'body': body != null ? body.toString() : null,
      'queued_at': DateTime.now().toIso8601String(),
    });
  }

  /// Attempt to send all pending operations. Called on connectivity restore
  /// and on app foreground.
  Future<void> syncPending() async {
    if (!_isOnline || _syncing || _db == null) return;
    _syncing = true;
    try {
      final ops = await _db!.query('pending_ops', orderBy: 'queued_at ASC');
      for (final op in ops) {
        final id = op['id'] as int;
        final method = op['method'] as String;
        final path = op['path'] as String;
        final bodyStr = op['body'] as String?;

        try {
          final response = await ApiClient().dio.request(
            path,
            data: bodyStr,
            options: Options(method: method),
          );
          if (response.statusCode != null && response.statusCode! < 400) {
            await _db!.delete('pending_ops', where: 'id = ?', whereArgs: [id]);
          } else {
            await _db!.update('pending_ops', {'attempts': (op['attempts'] as int) + 1}, where: 'id = ?', whereArgs: [id]);
          }
        } catch (_) {
          // Leave in queue; will retry on next sync
          await _db!.update('pending_ops', {'attempts': (op['attempts'] as int) + 1}, where: 'id = ?', whereArgs: [id]);
          break; // Stop syncing — likely offline again
        }
      }
    } finally {
      _syncing = false;
    }
  }

  Future<int> pendingCount() async {
    if (_db == null) return 0;
    final result = await _db!.rawQuery('SELECT COUNT(*) as count FROM pending_ops');
    return Sqflite.firstIntValue(result) ?? 0;
  }

  Future<void> close() async {
    await _connSub?.cancel();
    await _onlineController.close();
    await _db?.close();
  }
}
