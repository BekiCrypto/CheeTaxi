import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Driver onboarding')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Text(
            'Complete your driver profile',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          const Text(
            'You will need to upload your documents and pass background checks before your first trip.',
            style: TextStyle(color: AppColors.ink500),
          ),
          const SizedBox(height: 32),
          _step(context, 1, 'Phone verified', '✓', true),
          _step(context, 2, 'KYC documents', 'Upload license & ID', false),
          _step(context, 3, 'Background check', 'Pending submission', false),
          _step(context, 4, 'Vehicle registration', 'Upload vehicle documents', false),
          _step(context, 5, 'Vehicle inspection', 'Schedule inspection', false),
          _step(context, 6, 'Subscription', 'Choose a plan to start driving', false),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Onboarding flow UI — wire to /drivers/onboard + /vehicles endpoints')),
              );
            },
            child: const Text('Start onboarding'),
          ),
        ],
      ),
    );
  }

  Widget _step(BuildContext context, int n, String title, String subtitle, bool done) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: done ? AppColors.brand50 : AppColors.ink50,
        border: Border.all(color: done ? AppColors.brand : AppColors.ink100),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: done ? AppColors.brand : AppColors.ink200,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: done
                  ? const Icon(Icons.check, color: Colors.white, size: 18)
                  : Text('$n', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.ink600)),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
                Text(subtitle, style: const TextStyle(color: AppColors.ink500, fontSize: 13)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
