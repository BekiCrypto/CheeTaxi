import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'screens/splash_screen.dart';
import 'theme/app_colors.dart';
import 'l10n/app_localizations.dart';

final driverLocaleProvider = StateNotifierProvider<DriverLocaleNotifier, Locale>((ref) {
  return DriverLocaleNotifier();
});

class DriverLocaleNotifier extends StateNotifier<Locale> {
  DriverLocaleNotifier() : super(const Locale('en'));
  static const _prefsKey = 'cheetaxi.driver.locale';

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final code = prefs.getString(_prefsKey) ?? 'en';
    state = Locale(code);
  }

  Future<void> set(Locale locale) async {
    state = locale;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefsKey, locale.languageCode);
  }
}

class CheeTaxiDriverApp extends ConsumerStatefulWidget {
  const CheeTaxiDriverApp({super.key});

  @override
  ConsumerState<CheeTaxiDriverApp> createState() => _CheeTaxiDriverAppState();
}

class _CheeTaxiDriverAppState extends ConsumerState<CheeTaxiDriverApp> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(driverLocaleProvider.notifier).init());
  }

  @override
  Widget build(BuildContext context) {
    final locale = ref.watch(driverLocaleProvider);
    return MaterialApp(
      title: 'CheeTaxi Driver',
      debugShowCheckedModeBanner: false,
      locale: locale,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.brand,
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        textTheme: GoogleFonts.plusJakartaSansTextTheme(Theme.of(context).textTheme),
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.ink900,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.brand,
            foregroundColor: Colors.white,
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ),
      home: const SplashScreen(),
    );
  }
}
