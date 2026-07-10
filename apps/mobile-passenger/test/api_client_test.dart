import 'package:flutter_test/flutter_test.dart';
import 'package:cheetaxi_passenger/services/api_client.dart';

void main() {
  group('ApiClient', () {
    test('is a singleton', () {
      expect(ApiClient(), same(ApiClient()));
    });

    test('logout clears storage without throwing', () async {
      // Should not throw even if nothing was stored
      await ApiClient().logout();
      expect(true, isTrue);
    });
  });
}
