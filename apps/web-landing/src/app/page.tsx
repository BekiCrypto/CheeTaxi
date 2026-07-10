import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Hero } from '@/components/hero';
import { StatsBar } from '@/components/stats-bar';
import { PassengerCTA } from '@/components/passenger-cta';
import { DriverCTA } from '@/components/driver-cta';
import { TransportModes } from '@/components/transport-modes';
import { SubscriptionPlans } from '@/components/subscription-plans';
import { AfricaFirst } from '@/components/africa-first';
import { Safety } from '@/components/safety';
import { FAQ } from '@/components/faq';
import { Footer } from '@/components/footer';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <StatsBar />
      <PassengerCTA />
      <DriverCTA />
      <TransportModes />
      <SubscriptionPlans />
      <AfricaFirst />
      <Safety />
      <FAQ />
      <Footer />
    </main>
  );
}
