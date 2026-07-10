import 'package:flutter_test/flutter_test.dart';
import 'package:cheetaxi_driver/services/api_client.dart';

void main() {
  group('DriverApiClient', () {
    test('is a singleton', () {
      expect(DriverApiClient(), same(DriverApiClient()));
    });

    test('has a Dio instance', () {
      expect(DriverApiClient().dio, isNotNull);
    });

    test('stopLocationBroadcast does not throw when not started', () async {
      await DriverApiClient().stopLocationBroadcast();
      expect(true, isTrue);
    });
  });
}
