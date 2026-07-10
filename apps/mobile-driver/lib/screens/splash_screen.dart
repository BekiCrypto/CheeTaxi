import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';
import 'auth_screen.dart';
import 'home_screen.dart';
import 'onboarding_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;
    final user = await DriverApiClient().me();
    if (!mounted) return;
    if (user == null) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const AuthScreen()),
      );
      return;
    }
    final profile = await DriverApiClient().getProfile();
    if (!mounted) return;
    final isOnboarded = profile?['kycStatus'] == 'ONBOARDING_COMPLETE';
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => isOnboarded ? const HomeScreen() : const OnboardingScreen(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.ink900,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Text(
              'CheeTaxi',
              style: TextStyle(
                color: AppColors.brand,
                fontSize: 48,
                fontWeight: FontWeight.w800,
                letterSpacing: -1,
              ),
            ),
            SizedBox(height: 4),
            Text(
              'Driver',
              style: TextStyle(color: Colors.white70, fontSize: 16, letterSpacing: 4),
            ),
            SizedBox(height: 40),
            CircularProgressIndicator(color: AppColors.brand, strokeWidth: 2),
          ],
        ),
      ),
    );
  }
}
