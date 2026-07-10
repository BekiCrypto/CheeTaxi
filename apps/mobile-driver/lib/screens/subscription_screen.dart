import 'package:flutter/material.dart';

import '../services/api_client.dart';
import '../theme/app_colors.dart';

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  List<dynamic> _plans = [];
  Map<String, dynamic>? _active;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final plansRes = await DriverApiClient().dio.get('/subscriptions/plans');
      final activeRes = await DriverApiClient().dio.get('/subscriptions/me/active');
      if (!mounted) return;
      setState(() {
        _plans = (plansRes.data['data'] as List?) ?? [];
        _active = activeRes.data['data'] as Map<String, dynamic>?;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    return Scaffold(
      appBar: AppBar(title: const Text('Subscription')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          if (_active != null) ...[
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [AppColors.success, Color(0xFF0E8C66)]),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Active subscription', style: TextStyle(color: Colors.white70, fontSize: 13)),
                  const SizedBox(height: 4),
                  Text(_active!['plan']?['name'] ?? '',
                    style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  if (_active!['endsAt'] != null)
                    Text('Expires ${DateTime.parse(_active!['endsAt']).toLocal().toString().substring(0, 10)}',
                      style: const TextStyle(color: Colors.white70, fontSize: 13)),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
          const Text('Choose a plan', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          ..._plans.map(_planCard),
        ],
      ),
    );
  }

  Widget _planCard(dynamic plan) {
    final isActive = _active != null && _active!['planId'] == plan['id'];
    final isPopular = plan['code'] == 'MONTHLY';
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(
          color: isPopular ? AppColors.brand : AppColors.ink100,
          width: isPopular ? 2 : 1,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(plan['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                    if (isPopular) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(8)),
                        child: const Text('Most popular',
                          style: TextStyle(color: AppColors.brand700, fontSize: 11, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Text('${plan['durationDays']} days · unlimited rides',
                  style: const TextStyle(color: AppColors.ink500, fontSize: 13)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('${plan['currency']} ${plan['price']}',
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
              if (!isActive)
                TextButton(
                  onPressed: () => _purchase(plan),
                  child: const Text('Subscribe'),
                )
              else
                const Padding(
                  padding: EdgeInsets.only(top: 6),
                  child: Text('Active', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w600, fontSize: 13)),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _purchase(dynamic plan) async {
    try {
      await DriverApiClient().dio.post('/subscriptions/purchase', data: {
        'planCode': plan['code'],
        'paymentMethod': 'CASH',
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Subscription activated!')),
      );
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed: $e')),
      );
    }
  }
}
