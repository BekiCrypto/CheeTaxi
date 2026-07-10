import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CheeTaxi Dispatcher',
  description: 'Real-time dispatch console for CheeTaxi operations.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
