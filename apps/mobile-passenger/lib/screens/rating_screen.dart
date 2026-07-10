import 'package:flutter/material.dart';

import '../services/api_client.dart';
import '../theme/app_colors.dart';

class RatingScreen extends StatefulWidget {
  final String tripId;
  const RatingScreen({super.key, required this.tripId});

  @override
  State<RatingScreen> createState() => _RatingScreenState();
}

class _RatingScreenState extends State<RatingScreen> {
  int _stars = 5;
  final _commentCtrl = TextEditingController();
  bool _submitting = false;
  final Set<String> _tags = {};

  static const _TAG_OPTIONS = [
    'Safe driving', 'Friendly', 'Clean car', 'On time', 'Quiet ride',
    'Knows the city', 'Helped with bags',
  ];

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      await ApiClient().rateTrip(widget.tripId, _stars,
        comment: _commentCtrl.text.isEmpty ? null : _commentCtrl.text,
      );
      if (!mounted) return;
      Navigator.of(context).popUntil((route) => route.isFirst);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not submit rating')),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Rate your trip')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 24),
            const Center(
              child: Text('How was your ride?', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
            ),
            const SizedBox(height: 8),
            const Center(
              child: Text('Your feedback helps us improve.', style: TextStyle(color: AppColors.ink500)),
            ),
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (i) {
                final star = i + 1;
                return IconButton(
                  onPressed: () => setState(() => _stars = star),
                  icon: Icon(
                    star <= _stars ? Icons.star : Icons.star_border,
                    color: AppColors.brand,
                    size: 48,
                  ),
                );
              }),
            ),
            const SizedBox(height: 24),
            const Text('What went well?', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: _TAG_OPTIONS.map((tag) {
                final selected = _tags.contains(tag);
                return FilterChip(
                  label: Text(tag),
                  selected: selected,
                  onSelected: (s) => setState(() {
                    if (s) _tags.add(tag); else _tags.remove(tag);
                  }),
                  selectedColor: AppColors.brand100,
                  checkmarkColor: AppColors.brand700,
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _commentCtrl,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Optional comment...',
              ),
            ),
            const Spacer(),
            ElevatedButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Submit rating'),
            ),
          ],
        ),
      ),
    );
  }
}
