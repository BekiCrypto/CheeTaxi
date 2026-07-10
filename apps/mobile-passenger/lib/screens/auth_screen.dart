import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/api_client.dart';
import '../theme/app_colors.dart';
import '../l10n/app_localizations.dart';
import '../main.dart' show localeProvider;
import 'otp_verify_screen.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final _phoneCtrl = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    final l = AppLocalizations.of(context)!;
    final phone = _phoneCtrl.text.trim();
    if (phone.length < 9) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l.phoneNumber)),
      );
      return;
    }
    setState(() => _loading = true);
    final ok = await ApiClient().requestOtp(phone);
    if (!mounted) return;
    setState(() => _loading = false);
    if (ok) {
      Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => OtpVerifyScreen(phone: phone),
      ));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not send OTP. Try again.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l.signIn)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 24),
            Text(
              l.welcome,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: AppColors.ink900,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              l.byContinuing,
              style: const TextStyle(color: AppColors.ink500, fontSize: 12),
            ),
            const SizedBox(height: 32),
            Text(l.phoneNumber, style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            TextField(
              controller: _phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                hintText: l.phoneHint,
                prefixIcon: const Icon(Icons.phone_outlined),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : _sendOtp,
              child: _loading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text(l.sendCode),
            ),
            const Spacer(),
            // Language switcher
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _langButton('en', 'English'),
                const SizedBox(width: 8),
                _langButton('am', 'አማርኛ'),
                const SizedBox(width: 8),
                _langButton('fr', 'Français'),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _langButton(String code, String label) {
    final locale = ref.watch(localeProvider);
    final isSelected = locale.languageCode == code;
    return TextButton(
      onPressed: () => ref.read(localeProvider.notifier).set(Locale(code)),
      child: Text(
        label,
        style: TextStyle(
          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w400,
          color: isSelected ? AppColors.brand : AppColors.ink500,
        ),
      ),
    );
  }
}
