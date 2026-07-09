import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../theme/app_colors.dart';
import 'otp_verify_screen.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _phoneCtrl = TextEditingController();
  bool _loading = false;

  Future<void> _sendOtp() async {
    final phone = _phoneCtrl.text.trim();
    if (phone.length < 9) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid phone number')),
      );
      return;
    }
    setState(() => _loading = true);
    final ok = await DriverApiClient().requestOtp(phone);
    if (!mounted) return;
    setState(() => _loading = false);
    if (ok) {
      Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => OtpVerifyScreen(phone: phone),
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Driver sign in')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 32),
            const Icon(Icons.drive_eta, size: 64, color: AppColors.brand),
            const SizedBox(height: 16),
            Text(
              'Drive with CheeTaxi',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            const Text(
              'Pay one subscription. Keep 100% of every fare. No commission, ever.',
              style: TextStyle(color: AppColors.ink500),
            ),
            const SizedBox(height: 32),
            const Text('Phone number', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            TextField(
              controller: _phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                hintText: '+251911223344',
                prefixIcon: Icon(Icons.phone_outlined),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : _sendOtp,
              child: _loading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Send verification code'),
            ),
          ],
        ),
      ),
    );
  }
}
