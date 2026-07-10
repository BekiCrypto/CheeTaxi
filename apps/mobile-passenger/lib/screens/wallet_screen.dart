import 'package:flutter/material.dart';

import '../services/api_client.dart';
import '../theme/app_colors.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
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
      final w = await ApiClient().dio.get('/wallets/me');
      final t = await ApiClient().dio.get('/wallets/me/transactions?page=1&limit=20');
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
    final balance = _wallet?['balance'] ?? '0';
    final currency = _wallet?['currency'] ?? 'ETB';

    return Scaffold(
      appBar: AppBar(title: const Text('My Wallet')),
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
                const Text('Available balance', style: TextStyle(color: Colors.white70, fontSize: 13)),
                const SizedBox(height: 4),
                Text('$currency $balance',
                  style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w800)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _showTopupSheet(context),
                  icon: const Icon(Icons.add),
                  label: const Text('Top up'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Text('Recent transactions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          ..._transactions.map(_transactionTile),
          if (_transactions.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 32),
              child: Center(child: Text('No transactions yet', style: TextStyle(color: AppColors.ink400))),
            ),
        ],
      ),
    );
  }

  Widget _transactionTile(dynamic t) {
    final amount = (t['amount'] as num?)?.toDouble() ?? 0;
    final isCredit = amount >= 0;
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: isCredit ? AppColors.success.withOpacity(0.15) : AppColors.ink100,
        child: Icon(isCredit ? Icons.arrow_downward : Icons.arrow_upward,
          color: isCredit ? AppColors.success : AppColors.ink500, size: 18),
      ),
      title: Text(t['description'] ?? t['type'] ?? 'Transaction',
        style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text(t['createdAt'] != null ? DateTime.parse(t['createdAt']).toString().substring(0, 16) : ''),
      trailing: Text(
        '${isCredit ? '+' : ''}$amount ${t['currency'] ?? ''}',
        style: TextStyle(
          fontWeight: FontWeight.w700,
          color: isCredit ? AppColors.success : AppColors.ink700,
        ),
      ),
    );
  }

  void _showTopupSheet(BuildContext context) {
    final amountCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 24, right: 24, top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Top up wallet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            TextField(
              controller: amountCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(hintText: 'Amount in Br', prefixText: 'Br '),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                final amount = num.tryParse(amountCtrl.text);
                if (amount == null || amount <= 0) return;
                await ApiClient().dio.post('/wallets/me/topup', data: {
                  'amount': amount,
                  'currency': 'ETB',
                  'provider': 'chapa',
                });
                if (ctx.mounted) Navigator.pop(ctx);
                _load();
              },
              child: const Text('Top up with Chapa'),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
