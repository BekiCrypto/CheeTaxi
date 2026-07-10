import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import en from '../../messages/en.json';
import '../styles/globals.css';

// Enable dynamic rendering for i18n support
export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const display = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://cheetaxi.africa'),
  title: {
    default: 'CheeTaxi — Fast. Reliable. African. Modern.',
    template: '%s | CheeTaxi',
  },
  description:
    'The most modern mobility platform designed for Africa. Passengers ride free. Drivers earn 100% — pay one subscription, keep all your fares.',
  keywords: ['ride hailing', 'Ethiopia', 'Africa', 'taxi', 'mobility', 'delivery', 'driver subscription'],
  authors: [{ name: 'CheeTaxi' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cheetaxi.africa',
    siteName: 'CheeTaxi',
    title: 'CheeTaxi — Fast. Reliable. African. Modern.',
    description: 'The most modern mobility platform designed for Africa.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CheeTaxi',
    description: 'The most modern mobility platform designed for Africa.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body>
        <NextIntlClientProvider locale="en" messages={en}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
