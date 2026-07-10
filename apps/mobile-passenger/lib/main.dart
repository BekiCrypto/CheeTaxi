import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'screens/splash_screen.dart';
import 'theme/app_colors.dart';
import 'l10n/app_localizations.dart';

/// Provider for the user's preferred locale.
final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  return LocaleNotifier();
});

class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier() : super(const Locale('en'));
  static const _prefsKey = 'cheetaxi.locale';

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

class CheeTaxiPassengerApp extends ConsumerStatefulWidget {
  const CheeTaxiPassengerApp({super.key});

  @override
  ConsumerState<CheeTaxiPassengerApp> createState() => _CheeTaxiPassengerAppState();
}

class _CheeTaxiPassengerAppState extends ConsumerState<CheeTaxiPassengerApp> {
  @override
  void initState() {
    super.initState();
    // Load saved locale on startup
    Future.microtask(() => ref.read(localeProvider.notifier).init());
  }

  @override
  Widget build(BuildContext context) {
    final locale = ref.watch(localeProvider);
    return MaterialApp(
      title: 'CheeTaxi',
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
        textTheme: GoogleFonts.plusJakartaSansTextTheme(
          Theme.of(context).textTheme,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: AppColors.ink900,
          elevation: 0,
          centerTitle: false,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.ink50,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.brand,
            foregroundColor: Colors.white,
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
          ),
        ),
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.brand,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const SplashScreen(),
    );
  }
}
