import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Theme smoke tests', () {
    testWidgets('MaterialApp builds with default light theme', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: const Center(child: Text('CheeTaxi')),
          ),
        ),
      );
      expect(find.text('CheeTaxi'), findsOneWidget);
    });

    testWidgets('Button tap increments counter', (tester) async {
      int count = 0;
      await tester.pumpWidget(
        MaterialApp(
          home: StatefulBuilder(
            builder: (ctx, setState) => Scaffold(
              body: Text('Count: $count'),
              floatingActionButton: FloatingActionButton(
                onPressed: () => setState(() => count++),
                child: const Icon(Icons.add),
              ),
            ),
          ),
        ),
      );
      expect(find.text('Count: 0'), findsOneWidget);
      await tester.tap(find.byType(FloatingActionButton));
      await tester.pump();
      expect(find.text('Count: 1'), findsOneWidget);
    });
  });
}
