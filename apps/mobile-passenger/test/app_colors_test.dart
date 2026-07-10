import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:cheetaxi_passenger/theme/app_colors.dart';

void main() {
  group('AppColors', () {
    test('brand color is the expected orange', () {
      expect(AppColors.brand, const Color(0xFFF08C00));
    });

    test('ink colors form a coherent palette', () {
      // Luminance decreases from ink50 to ink900
      expect(AppColors.ink50.computeLuminance(), greaterThan(AppColors.ink900.computeLuminance()));
    });

    test('status colors are distinct', () {
      expect(AppColors.success, isNot(AppColors.danger));
      expect(AppColors.danger, isNot(AppColors.warning));
      expect(AppColors.warning, isNot(AppColors.info));
    });
  });
}
