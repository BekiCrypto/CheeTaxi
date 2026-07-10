import 'package:flutter/material.dart';

import '../services/api_client.dart';
import '../theme/app_colors.dart';

class DriverWalletScreen extends StatefulWidget {
  const DriverWalletScreen({super.key});

  @override
  State<DriverWalletScreen> createState() => _DriverWalletScreenState();
}

class _DriverWalletScreenState extends State<DriverWalletScreen> {
  Map<String, dynamic>? _wallet;
  List<dynamic> _transactions = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final w = await DriverApiClient().dio.get('/wallets/me');
      final t = await DriverApiClient().dio.get('/wallets/me/transactions?page=1&limit=20');
      if (!mounted) return;
      setState(() {
        _wallet = w.data['data'] as Map<String, dynamic>?;
        _transactions = (t.data['data']?['items'] as List?) ?? [];
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
      appBar: AppBar(title: const Text('My Earnings')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [AppColors.brand, AppColors.brand600]),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Available to withdraw', style: TextStyle(color: Colors.white70, fontSize: 13)),
                const SizedBox(height: 4),
                Text('${_wallet?['currency'] ?? 'ETB'} ${_wallet?['balance'] ?? '0'}',
                  style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w800)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _showWithdrawSheet,
            icon: const Icon(Icons.account_balance_outlined),
            label: const Text('Withdraw to bank / mobile money'),
          ),
          const SizedBox(height: 24),
          const Text('Earnings history', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          ..._transactions.map(_tile),
        ],
      ),
    );
  }

  Widget _tile(dynamic t) {
    final amount = (t['amount'] as num?)?.toDouble() ?? 0;
    final isCredit = amount >= 0;
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: isCredit ? AppColors.success.withOpacity(0.15) : AppColors.ink100,
        child: Icon(isCredit ? Icons.add : Icons.remove, color: isCredit ? AppColors.success : AppColors.ink500, size: 18),
      ),
      title: Text(t['description'] ?? t['type'] ?? 'Transaction', style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text(t['createdAt'] != null ? DateTime.parse(t['createdAt']).toString().substring(0, 16) : ''),
      trailing: Text(
        '${isCredit ? '+' : ''}$amount ${t['currency'] ?? ''}',
        style: TextStyle(fontWeight: FontWeight.w700, color: isCredit ? AppColors.success : AppColors.ink700),
      ),
    );
  }

  void _showWithdrawSheet() {
    final amountCtrl = TextEditingController();
    String method = 'bank';
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 24, right: 24, top: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Withdraw earnings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 16),
              TextField(
                controller: amountCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(hintText: 'Amount in Br', prefixText: 'Br '),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: method,
                items: const [
                  DropdownMenuItem(value: 'bank', child: Text('Bank transfer')),
                  DropdownMenuItem(value: 'mobile_money', child: Text('Mobile money (Telebirr / CBE Birr)')),
                  DropdownMenuItem(value: 'cash_pickup', child: Text('Cash pickup at agent')),
                ],
                onChanged: (v) => setSt(() => method = v ?? 'bank'),
                decoration: const InputDecoration(labelText: 'Method'),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () async {
                  final amount = num.tryParse(amountCtrl.text);
                  if (amount == null || amount <= 0) return;
                  try {
                    await DriverApiClient().dio.post('/wallets/me/withdraw', data: {
                      'amount': amount, 'method': method,
                    });
                    if (ctx.mounted) Navigator.pop(ctx);
                    _load();
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Withdrawal requested. Processing within 1 hour.')),
                      );
                    }
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
                    }
                  }
                },
                child: const Text('Request withdrawal'),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
