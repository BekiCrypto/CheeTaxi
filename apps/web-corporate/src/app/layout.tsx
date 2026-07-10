import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'CheeTaxi Corporate', template: '%s · CheeTaxi Corporate' },
  description: 'Fleet management portal for CheeTaxi corporate partners.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
