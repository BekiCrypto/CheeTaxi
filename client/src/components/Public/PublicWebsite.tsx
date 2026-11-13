import React, { useState } from 'react';
import {
  Car,
  Shield,
  Smartphone,
  Globe,
  Zap,
  Users,
  Briefcase,
  Package,
  Layers,
  Code,
  FileText,
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  Search,
  ExternalLink,
  Lock,
  Clock,
  DollarSign,
  Award,
  TrendingUp,
  LifeBuoy,
  Star,
  Check,
  Truck,
  Building2,
  Terminal,
  Copy,
  FileCheck,
} from 'lucide-react';
import { Language } from '../../i18n/translations';

interface PublicWebsiteProps {
  language: Language;
  onNavigateToApp: (role: 'rider' | 'driver' | 'admin' | 'split') => void;
  initialPageId?: string;
}

export type PageId =
  | 'home'
  | 'about'
  | 'how_it_works'
  | 'passengers'
  | 'drivers'
  | 'subscriptions'
  | 'fleets'
  | 'corporate'
  | 'delivery'
  | 'partners'
  | 'providers'
  | 'developers'
  | 'blog'
  | 'faq'
  | 'contact'
  | 'help'
  | 'privacy'
  | 'terms'
  | 'driver_agreement'
  | 'partner_agreement'
  | 'safety'
  | 'cancellation';

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({
  language,
  onNavigateToApp,
  initialPageId,
}) => {
  const [currentPage, setCurrentPage] = useState<PageId>(
    (initialPageId as PageId) || 'home'
  );
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', subject: 'General Inquiry', message: '' });

  // Quick estimator demo on homepage
  const [demoPickup, setDemoPickup] = useState('Bole Medhanialem');
  const [demoDropoff, setDemoDropoff] = useState('Meskel Square');

  const pages: { id: PageId; title: string; category: string }[] = [
    { id: 'home', title: 'Home', category: 'Core' },
    { id: 'about', title: 'About Chebelew', category: 'Company' },
    { id: 'how_it_works', title: 'How It Works', category: 'Core' },
    { id: 'passengers', title: 'Passengers & Riders', category: 'Products' },
    { id: 'drivers', title: 'Drivers (0% Commission)', category: 'Products' },
    { id: 'subscriptions', title: 'Driver Subscription Plans', category: 'Pricing' },
    { id: 'fleets', title: 'Fleets & Cooperatives', category: 'Business' },
    { id: 'corporate', title: 'Corporate Transportation', category: 'Business' },
    { id: 'delivery', title: 'Delivery & Logistics', category: 'Products' },
    { id: 'partners', title: 'Aggregator Partner Program', category: 'Partners' },
    { id: 'providers', title: 'Provider Integration Portal', category: 'Partners' },
    { id: 'developers', title: 'Developers & OpenAPI', category: 'Technology' },
    { id: 'blog', title: 'Newsroom & Insights', category: 'Company' },
    { id: 'faq', title: 'Frequently Asked Questions', category: 'Support' },
    { id: 'contact', title: 'Contact Us', category: 'Company' },
    { id: 'help', title: 'Help Center (9922)', category: 'Support' },
    { id: 'privacy', title: 'Privacy Policy', category: 'Legal' },
    { id: 'terms', title: 'Terms of Service', category: 'Legal' },
    { id: 'driver_agreement', title: 'Driver Subscription Agreement', category: 'Legal' },
    { id: 'partner_agreement', title: 'Commercial Partner Agreement', category: 'Legal' },
    { id: 'safety', title: 'Safety & Emergency (991)', category: 'Support' },
    { id: 'cancellation', title: 'Cancellation & Refund Policy', category: 'Legal' },
  ];

  return (
    <div className="min-h-full flex flex-col bg-slate-50 text-slate-800 font-sans">
      {/* Sub-Navigation Bar for 22 Public Pages */}
      <nav className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="font-black text-sm tracking-tight text-white flex items-center gap-1.5 cursor-pointer"
              onClick={() => setCurrentPage('home')}
            >
              <span className="text-amber-400">Chebelew</span>
              <span className="text-[10px] bg-brand-600 px-1.5 py-0.5 rounded font-mono font-bold">
                PORTAL (22 PAGES)
              </span>
            </span>
          </div>

          {/* Quick Page Picker Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value as PageId)}
                className="bg-slate-800 text-white text-xs font-bold rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-400 max-w-[220px] md:max-w-xs truncate"
              >
                {[
                  'Core',
                  'Products',
                  'Pricing',
                  'Business',
                  'Partners',
                  'Technology',
                  'Company',
                  'Support',
                  'Legal',
                ].map((cat) => (
                  <optgroup key={cat} label={`--- ${cat} ---`}>
                    {pages
                      .filter((p) => p.category === cat)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <button
              onClick={() => onNavigateToApp('rider')}
              className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm"
            >
              Launch App
            </button>
          </div>
        </div>
      </nav>

      {/* Main Page Content Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* ======================================================== */}
        {/* PAGE 1: HOME */}
        {/* ======================================================== */}
        {currentPage === 'home' && (
          <div className="space-y-12">
            {/* Hero */}
            <div className="text-center space-y-4 py-8">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full border border-amber-300 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Ethiopia's Unified Mobility & Delivery Ecosystem</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Move Faster. Compare Fares. <br />
                <span className="text-brand-600">Zero Commission for Drivers.</span>
              </h1>
              <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Chebelew combines ride-hailing aggregation (RIDE, Feres, ZayRide), independent driver dispatching, dual-OTP parcel logistics, and corporate mobility into one unified platform built specifically for Addis Ababa.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => onNavigateToApp('rider')}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Book a Ride Now</span>
                </button>
                <button
                  onClick={() => onNavigateToApp('driver')}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  <Car className="w-4 h-4" />
                  <span>Drive with 0% Commission</span>
                </button>
              </div>
            </div>

            {/* Live Statistics Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-900 text-white rounded-2xl shadow-md">
              <div className="text-center space-y-1 border-r border-slate-800">
                <div className="text-2xl font-black text-amber-400">0%</div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Driver Commission</div>
              </div>
              <div className="text-center space-y-1 border-r border-slate-800">
                <div className="text-2xl font-black text-white">4.2 min</div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Average Addis ETA</div>
              </div>
              <div className="text-center space-y-1 border-r border-slate-800">
                <div className="text-2xl font-black text-emerald-400">15% VAT</div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Reg 570/2025 Compliant</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-black text-indigo-400">24/7</div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Hotline: 9922</div>
              </div>
            </div>

            {/* 3 Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition">
                <div className="p-3 bg-brand-50 text-brand-700 rounded-xl w-fit">
                  <Car className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Multi-Provider Aggregator</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Search pickup to dropoff once. Compare estimated prices and ETAs across Chebelew Standard, RIDE, and Feres in real time without opening multiple apps.
                </p>
                <button
                  onClick={() => setCurrentPage('passengers')}
                  className="text-brand-600 hover:text-brand-700 font-bold text-xs flex items-center gap-1 pt-1"
                >
                  Learn more <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition">
                <div className="p-3 bg-amber-50 text-amber-700 rounded-xl w-fit">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Driver Subscription Model</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Zero commission on trips. Drivers pay transparent daily, weekly, or monthly subscriptions and keep 100% of their metered earnings with instant Telebirr cashouts.
                </p>
                <button
                  onClick={() => setCurrentPage('subscriptions')}
                  className="text-brand-600 hover:text-brand-700 font-bold text-xs flex items-center gap-1 pt-1"
                >
                  View subscription plans <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition">
                <div className="p-3 bg-purple-50 text-purple-700 rounded-xl w-fit">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Dual-OTP Express Logistics</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Deliver packages, legal contracts, food, and e-commerce goods with 4-digit pickup and dropoff OTP verification and cryptographic proof of delivery.
                </p>
                <button
                  onClick={() => setCurrentPage('delivery')}
                  className="text-brand-600 hover:text-brand-700 font-bold text-xs flex items-center gap-1 pt-1"
                >
                  Explore delivery <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Regulatory & Payment Trust Badges */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block text-center">
                Official Ethiopian Regulatory & Payment Integrations
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-extrabold text-xs text-slate-800 block">Ethio Telecom</span>
                  <span className="text-[10px] text-slate-500 font-medium">Telebirr Direct Rails</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-extrabold text-xs text-slate-800 block">Ministry of Revenues</span>
                  <span className="text-[10px] text-slate-500 font-medium">VAT Reg. No. 570/2025</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-extrabold text-xs text-slate-800 block">Transport Bureau</span>
                  <span className="text-[10px] text-slate-500 font-medium">Addis Ababa City Admin</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-extrabold text-xs text-slate-800 block">Federal Police 991</span>
                  <span className="text-[10px] text-slate-500 font-medium">Real-Time SOS Dispatch</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 2: ABOUT */}
        {/* ======================================================== */}
        {currentPage === 'about' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">About Chebelew (ከበለው)</h2>
              <p className="text-xs text-slate-500 mt-1">Transforming Ethiopian Urban Mobility through Technology, Fair Economics, and Inclusivity.</p>
            </div>
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                Founded in Addis Ababa, Ethiopia, Chebelew is engineered to transform African urban transportation into an open, efficient, and equitable Mobility-as-a-Service (MaaS) ecosystem. In an urban landscape with over 40+ independent ride-hailing services, passengers struggle with fragmented availability and price disparities, while drivers suffer from escalating per-ride commissions (15% to 25%).
              </p>
              <p>
                Chebelew solves this systemic friction through a two-sided innovation:
              </p>
              <div className="grid md:grid-cols-2 gap-4 my-2">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">1. Multi-Fleet Aggregator</h4>
                  <p className="text-slate-600">Riders search once and see live arrival times and fares across Chebelew Standard, RIDE (Hybrid Designs), and Feres fleets simultaneously.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">2. 0% Commission Subscription</h4>
                  <p className="text-slate-600">Chebelew replaces exploitative trip commissions with transparent daily, weekly, or monthly subscriptions. Drivers keep 100% of their net metered fares.</p>
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-900 pt-2">Our Mission & Guiding Principles</h3>
              <p>
                To provide transparent, dependable, and dignified mobility for millions of passengers while granting drivers unlimited earnings potential under transparent operating rules, strict vehicle safety standards, and full regulatory compliance.
              </p>
              <h3 className="text-sm font-bold text-slate-900 pt-2">Full Regulatory Compliance</h3>
              <p>
                Chebelew operates in strict accordance with the Federal Democratic Republic of Ethiopia Ministry of Revenues Value Added Tax Regulation No. 570/2025 (mandating 15% VAT on platform rides), with automated electronic VAT tax receipts and instant tax reporting for tax authorities.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 3: HOW IT WORKS */}
        {/* ======================================================== */}
        {currentPage === 'how_it_works' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">How Chebelew Works</h2>
              <p className="text-xs text-slate-500 mt-1">End-to-End Operational Lifecycle for Riders, Drivers, and Dispatchers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-slate-600">
              {/* Rider Step-by-Step */}
              <div className="space-y-4">
                <span className="font-extrabold text-sm text-brand-600 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  <span>The Passenger Journey</span>
                </span>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-900">Step 1: Set Locations</span>
                    <p className="text-slate-500">Select pickup and destination from curated Addis Ababa landmarks (e.g. Bole Airport, Meskel Square, Kazanchis) or enter precise coordinates.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-900">Step 2: Compare Fleet Prices</span>
                    <p className="text-slate-500">Review real-time fare estimates across Sedan, Minivan, Comfort, and external aggregator partners (RIDE / Feres).</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-900">Step 3: Instant Dispatch</span>
                    <p className="text-slate-500">The nearest available driver receives an alert with live GPS navigation. Track their real-time arrival on the interactive Leaflet map.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-900">Step 4: Pay via Telebirr or Cash</span>
                    <p className="text-slate-500">Pay using Ethio Telecom Telebirr dynamic QR code, automated USSD push (*127#), or cash. Receive an official 15% VAT electronic tax invoice.</p>
                  </div>
                </div>
              </div>

              {/* Driver Step-by-Step */}
              <div className="space-y-4">
                <span className="font-extrabold text-sm text-amber-600 flex items-center gap-1.5">
                  <Car className="w-4 h-4" />
                  <span>The Driver Journey</span>
                </span>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-900">Step 1: Subscribe for 0% Commission</span>
                    <p className="text-slate-500">Activate a Daily (50 ETB), Weekly (300 ETB), or Monthly (1,000 ETB) pass using Telebirr. Zero per-trip percentage is taken.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-900">Step 2: Toggle Online</span>
                    <p className="text-slate-500">Switch online to transmit live GPS telemetry and receive incoming passenger ride and parcel delivery requests.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-900">Step 3: Complete Trips</span>
                    <p className="text-slate-500">Navigate to pickup, start in-cab taximeter, and complete destination dropoff. All metered gross fares are kept 100% by you.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-900">Step 4: Instant Telebirr Payouts</span>
                    <p className="text-slate-500">Withdraw wallet earnings directly to your personal Telebirr account 24 hours a day, 7 days a week.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 4: PASSENGERS */}
        {/* ======================================================== */}
        {currentPage === 'passengers' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">Passenger & Rider Experience</h2>
              <p className="text-xs text-slate-500 mt-1">Convenient, Transparent, and Safe Urban Travel Across Greater Addis Ababa.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-brand-600" />
                  <span>Fair Regulated Tariffs</span>
                </span>
                <p className="text-slate-500">
                  No arbitrary surge algorithms. Transparent base fare (70 ETB for Sedan), per-kilometer (14 ETB), and per-minute (3 ETB) rates.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-brand-600" />
                  <span>Bilingual Interface</span>
                </span>
                <p className="text-slate-500">
                  Switch instantly between አማርኛ (Amharic with Ethiopic script) and English across all screens, receipts, and notifications.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-brand-600" />
                  <span>Safety Panic Button (991)</span>
                </span>
                <p className="text-slate-500">
                  In-ride SOS button broadcasts your live vehicle coordinates and trip details to the Ethiopian Federal Police and safety response teams.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-slate-900">Vehicle Categories Available</h3>
              <div className="grid md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 border rounded-xl space-y-1">
                  <span className="font-bold text-slate-800">Chebelew Sedan</span>
                  <p className="text-slate-500">Toyota Corolla, Vitz, Dzire. 4 passenger seats with full A/C.</p>
                </div>
                <div className="p-3 border rounded-xl space-y-1">
                  <span className="font-bold text-slate-800">Chebelew XL (Minivan)</span>
                  <p className="text-slate-500">Toyota Avanza, Noah. 7 seats for group travel and airport luggage.</p>
                </div>
                <div className="p-3 border rounded-xl space-y-1">
                  <span className="font-bold text-slate-800">Executive Comfort VIP</span>
                  <p className="text-slate-500">Hyundai Elantra, Camry, RAV4. Premium comfort for corporate travelers.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateToApp('rider')}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
            >
              Open Passenger Web App
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 5: DRIVERS */}
        {/* ======================================================== */}
        {currentPage === 'drivers' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">Drive with Chebelew</h2>
              <p className="text-xs text-amber-700 font-bold mt-1">
                Founder Mandate: 0% Per-Trip Platform Commission Guarantee
              </p>
            </div>
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                At Chebelew, we recognize drivers as true business partners. On legacy apps, drivers forfeit 15% to 25% of their hard-earned fares on every single trip, losing 15,000 ETB to 25,000 ETB every month just in commissions.
              </p>

              {/* Economic Comparison Table */}
              <div className="overflow-x-auto my-3">
                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-3">Monthly Gross Fares</th>
                      <th className="p-3">Legacy App (15% Take)</th>
                      <th className="p-3">Legacy App (20% Take)</th>
                      <th className="p-3 bg-amber-100 text-amber-900 font-black">Chebelew (0% Commission)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-semibold">50,000 ETB</td>
                      <td className="p-3 text-rose-600 font-semibold">-7,500 ETB</td>
                      <td className="p-3 text-rose-600 font-semibold">-10,000 ETB</td>
                      <td className="p-3 bg-amber-50 text-emerald-700 font-black">1,000 ETB flat (Save 6,500 ETB!)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">80,000 ETB</td>
                      <td className="p-3 text-rose-600 font-semibold">-12,000 ETB</td>
                      <td className="p-3 text-rose-600 font-semibold">-16,000 ETB</td>
                      <td className="p-3 bg-amber-50 text-emerald-700 font-black">1,000 ETB flat (Save 11,000 ETB!)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">120,000 ETB</td>
                      <td className="p-3 text-rose-600 font-semibold">-18,000 ETB</td>
                      <td className="p-3 text-rose-600 font-semibold">-24,000 ETB</td>
                      <td className="p-3 bg-amber-50 text-emerald-700 font-black">1,000 ETB flat (Save 17,000 ETB!)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-sm font-bold text-slate-900 pt-2">Driver Onboarding Requirements</h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>Valid Ethiopian Driving License (Grade 3 or Public 1 Commercial).</li>
                <li>Commercial vehicle registration (Libre) with Code-3 or commercial yellow plate.</li>
                <li>Annual roadworthiness inspection certificate issued by the Addis Ababa Transport Bureau.</li>
                <li>Clean criminal record clearance certificate issued by the Federal Police.</li>
                <li>Active Telebirr registered account for instant automated payouts.</li>
              </ul>
            </div>
            <button
              onClick={() => onNavigateToApp('driver')}
              className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition shadow-sm"
            >
              Go to Driver Dashboard
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 6: SUBSCRIPTIONS */}
        {/* ======================================================== */}
        {currentPage === 'subscriptions' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">Driver Subscription Pricing Plans</h2>
              <p className="text-xs text-slate-500 mt-1">Configured for Addis Ababa, Ethiopia (ETB). No per-trip commission charged.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-5 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-700 block text-sm">Chebelew 24-Hour Pass</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    50 ETB <span className="text-xs font-normal text-slate-500">/ 1 day</span>
                  </div>
                  <p className="text-slate-500 mt-2">
                    Ideal for part-time weekend drivers testing the platform. Includes full dispatch access.
                  </p>
                </div>
                <ul className="space-y-1.5 text-slate-600 text-[11px] pt-3 border-t">
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Unlimited trip dispatches</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> 0% per-trip commission</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Telebirr wallet payout</li>
                </ul>
              </div>

              <div className="p-5 rounded-xl border-2 border-brand-500 bg-brand-50/20 space-y-3 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-700 block text-sm">Chebelew 7-Day Flex</span>
                    <span className="text-[10px] bg-brand-600 text-white font-bold px-2 py-0.5 rounded">POPULAR</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    300 ETB <span className="text-xs font-normal text-slate-500">/ 7 days</span>
                  </div>
                  <p className="text-slate-500 mt-2">
                    7 days of unlimited ride & express parcel delivery opportunities. Paid via Telebirr.
                  </p>
                </div>
                <ul className="space-y-1.5 text-slate-600 text-[11px] pt-3 border-t">
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Priority proximity matcher</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> 0% per-trip commission</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> Standard emergency SOS</li>
                </ul>
              </div>

              <div className="p-5 rounded-xl border-2 border-slate-900 bg-slate-900 text-white space-y-3 flex flex-col justify-between shadow-md">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 block text-sm">Chebelew Monthly Pro</span>
                    <span className="text-[10px] bg-amber-500 text-slate-900 font-bold px-2 py-0.5 rounded">BEST VALUE</span>
                  </div>
                  <div className="text-2xl font-black text-white mt-1">
                    1,000 ETB <span className="text-xs font-normal text-slate-400">/ 30 days</span>
                  </div>
                  <p className="text-slate-300 mt-2">
                    For full-time professional drivers keeping 100% of all fares for an entire month.
                  </p>
                </div>
                <ul className="space-y-1.5 text-slate-300 text-[11px] pt-3 border-t border-slate-800">
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-400" /> Exclusive Bole airport queue</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-400" /> Instant 24/7 Telebirr payouts</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-400" /> Dedicated operations officer</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 7: FLEETS */}
        {/* ======================================================== */}
        {currentPage === 'fleets' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">Fleets & Cooperative Associations</h2>
              <p className="text-xs text-slate-500 mt-1">Centralized Fleet Management, Telematics, and Subsidized Group Subscriptions.</p>
            </div>
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                Chebelew partners with registered taxi associations, blue-and-white meter taxi unions, and commercial fleet owners across Addis Ababa. Register your cooperative to manage vehicles, monitor live GPS positions, and track collective revenues through our multi-tenant fleet dashboard.
              </p>
              <div className="grid md:grid-cols-2 gap-4 my-2">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-brand-600" />
                    <span>Real-Time Fleet Telematics</span>
                  </h4>
                  <p className="text-slate-600">Track all union vehicles on a unified Leaflet GIS map with breadcrumb trails, speed monitoring, and geofencing.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-brand-600" />
                    <span>Group Subscription Discounts</span>
                  </h4>
                  <p className="text-slate-600">Cooperatives with 20+ vehicles receive 15% discounts on Monthly Pro passes and subsidized initial KYC verification fees.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 8: CORPORATE */}
        {/* ======================================================== */}
        {currentPage === 'corporate' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">Corporate Transportation & SaaS</h2>
              <p className="text-xs text-slate-500 mt-1">Enterprise Mobility Management, Electronic VAT Tax Invoicing, and Travel Allowance Controls.</p>
            </div>
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                Provide safe, reliable transportation for your enterprise team with monthly credit limits, electronic VAT invoices, and automated travel allowance debits. Trusted by banks, embassies, and Ethiopian enterprises including the Commercial Bank of Ethiopia (CBE) and Ethiopian Airlines Commercial Group.
              </p>
              <div className="grid md:grid-cols-3 gap-3 my-2 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-900 block">Monthly Consolidated Invoicing</span>
                  <p className="text-slate-500">Single monthly statement with Ministry of Revenues VAT Regulation No. 570/2025 electronic tax receipts for business expense deduction.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-900 block">Per-Employee Spending Limits</span>
                  <p className="text-slate-500">Assign individual monthly credit budgets for managers, sales representatives, and late-night shift employees.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-900 block">Executive VIP Airport Transfers</span>
                  <p className="text-slate-500">Pre-booked airport pickup from Bole International Airport with dedicated VIP comfort vehicles and flight delay monitoring.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 9: DELIVERY */}
        {/* ======================================================== */}
        {currentPage === 'delivery' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">Chebelew Express Delivery & Logistics</h2>
              <p className="text-xs text-slate-500 mt-1">Dual-OTP Cryptographic Protection for Secure Urban Last-Mile Logistics.</p>
            </div>
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                Send legal contracts, merchandise, packages, food, and e-commerce orders across Addis Ababa with our industry-first <strong>Dual-OTP Protection Protocol</strong>.
              </p>
              <div className="grid md:grid-cols-2 gap-4 my-2">
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 space-y-2 text-purple-900">
                  <h4 className="font-bold text-sm flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-purple-600" />
                    <span>1. Pickup OTP Verification</span>
                  </h4>
                  <p className="text-xs text-purple-800">The courier must enter the sender's 4-digit code in the in-cab app before taking custody of the parcel, transitioning order status to IN_TRANSIT.</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-2 text-emerald-900">
                  <h4 className="font-bold text-sm flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>2. Dropoff OTP & Photo Proof</span>
                  </h4>
                  <p className="text-xs text-emerald-800">The courier must collect the recipient's 4-digit code and photograph the package upon delivery before the order can be marked DELIVERED.</p>
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-900 pt-2">Parcel Categories & Pricing</h3>
              <p>
                Standard city dispatch starts at <strong>40 ETB base + 10 ETB/km</strong>. Packages up to 20 kg supported via motorbikes, sedans, and cargo logistics vans.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 10: PARTNERS */}
        {/* ======================================================== */}
        {currentPage === 'partners' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">Aggregator Partner Program</h2>
              <p className="text-xs text-slate-500 mt-1">Expanding Market Demand for Established Transportation Operators in Ethiopia.</p>
            </div>
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                Chebelew is designed as an open aggregator that complements existing operators like RIDE (Hybrid Designs PLC), Feres Technologies, and ZayRide. Through official API integration, partner operators gain access to incremental passenger demand while riders enjoy one unified booking experience.
              </p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Why Partner with Chebelew?</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>Zero Customer Acquisition Cost:</strong> Receive qualified trip dispatches directly from Chebelew passengers.</li>
                  <li><strong>Reduced Deadhead Mileage:</strong> Fill unoccupied driver return trips across key corridors (e.g. Bole to Mercato).</li>
                  <li><strong>Automated Settlement:</strong> Weekly automated Telebirr batch settlements with transparent ride reconciliation reports.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 11: PROVIDERS */}
        {/* ======================================================== */}
        {currentPage === 'providers' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">Provider Integration Portal</h2>
              <p className="text-xs text-slate-500 mt-1">Technical Architecture, Webhook Standards, and Circuit Breaker Resilience.</p>
            </div>
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                Connecting your fleet dispatch backend to Chebelew is straightforward with our normalized OpenAPI v3 integration adapters.
              </p>
              <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1">
                <div className="text-amber-400 font-bold"># Provider Adapter Interface (GET /api/providers/status)</div>
                <div>{"{"}</div>
                <div className="pl-4">"providers": [</div>
                <div className="pl-8">{"{ id: 'ride', name: 'RIDE', circuitState: 'CLOSED', failureCount: 0 }"},</div>
                <div className="pl-8">{"{ id: 'feres', name: 'Feres', circuitState: 'CLOSED', failureCount: 0 }"}</div>
                <div className="pl-4">]</div>
                <div>{"}"}</div>
              </div>
              <p>
                Chebelew implements the <strong>Circuit Breaker pattern</strong>. If a partner API encounters 3 consecutive timeouts or errors, the circuit breaker automatically trips to OPEN for 30 seconds to prevent passenger booking freezes, seamlessly routing trips to alternate available fleets.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 12: DEVELOPERS */}
        {/* ======================================================== */}
        {currentPage === 'developers' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Developer API & Webhooks</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Integrate ride booking, delivery dispatching, and fare estimation directly into your e-commerce platform, corporate ERP, or mobile app.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/api/developer/openapi.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition border border-slate-200"
                >
                  <Code className="w-3.5 h-3.5 text-indigo-600" />
                  <span>OpenAPI Spec</span>
                </a>
                <button
                  onClick={() => onNavigateToApp('admin')}
                  className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>API Keys Console</span>
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] space-y-2">
                <div className="text-amber-400 font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>POST /api/rides/estimate</span>
                </div>
                <div className="text-slate-400">curl -X POST https://chebelew.trustlotto.app/api/rides/estimate \</div>
                <div className="text-slate-400 pl-4">-H "Content-Type: application/json" \</div>
                <div className="text-slate-400 pl-4">-d '{"{"}"pickup":{"{"}"lat":8.995,"lng":38.788{"}"},"destination":{"{"}"lat":9.010,"lng":38.761{"}"}{"}"}'</div>
              </div>

              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] space-y-2">
                <div className="text-emerald-400 font-bold flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  <span>POST /api/deliveries</span>
                </div>
                <div className="text-slate-400">curl -X POST https://chebelew.trustlotto.app/api/deliveries \</div>
                <div className="text-slate-400 pl-4">-H "Content-Type: application/json" \</div>
                <div className="text-slate-400 pl-4">-d '{"{"}"senderId":"usr_01","recipientPhone":"+251911...","packageDescription":"Docs"{"}"}'</div>
              </div>
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-3">
              <Code className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Official REST SDK & Webhook Notifications:</span> Chebelew provides real-time event webhooks for ride status (`ride.assigned`, `ride.started`, `ride.completed`), driver subscriptions, and parcel pickup/dropoff OTP confirmations.
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 13: BLOG */}
        {/* ======================================================== */}
        {currentPage === 'blog' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">Newsroom & Mobility Insights</h2>
              <p className="text-xs text-slate-500 mt-1">Official Press Releases, Regulatory Updates, and Engineering Articles.</p>
            </div>
            <div className="space-y-4 text-xs">
              <div className="border-b pb-3 space-y-1">
                <span className="text-[10px] text-brand-600 font-bold uppercase">Press Release</span>
                <h4 className="font-bold text-sm text-slate-900">Chebelew Launches 0% Driver Subscription Model in Addis Ababa</h4>
                <p className="text-slate-500">Transforming driver take-home earnings and pioneering fair mobility in the Horn of Africa.</p>
              </div>
              <div className="border-b pb-3 space-y-1">
                <span className="text-[10px] text-emerald-600 font-bold uppercase">Regulatory Compliance</span>
                <h4 className="font-bold text-sm text-slate-900">Full Compliance with FDRE VAT Regulation No. 570/2025</h4>
                <p className="text-slate-500">Automating 15% VAT calculation and instant receipts across all digital and cash transactions.</p>
              </div>
              <div className="border-b pb-3 space-y-1">
                <span className="text-[10px] text-purple-600 font-bold uppercase">Technology Innovation</span>
                <h4 className="font-bold text-sm text-slate-900">Dual-OTP Cryptographic Protection: Ending Last-Mile Delivery Fraud</h4>
                <p className="text-slate-500">How 4-digit pickup and dropoff verification codes protect merchants and customers across Addis Ababa.</p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 14: FAQ */}
        {/* ======================================================== */}
        {currentPage === 'faq' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">Frequently Asked Questions (FAQ)</h2>
              <p className="text-xs text-slate-500 mt-1">Answers to Common Questions from Riders, Drivers, Merchants, and Enterprise Partners.</p>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                <span className="font-bold text-slate-900">Does Chebelew take any commission from drivers on completed rides?</span>
                <p className="text-slate-600">No. Under the Founder Mandate, Chebelew drivers pay zero per-trip commission. Drivers keep 100% of their net fares. Only a low fixed subscription is required.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                <span className="font-bold text-slate-900">How do passengers pay for trips?</span>
                <p className="text-slate-600">Passengers can pay digitally via Ethio Telecom Telebirr (dynamic QR code or USSD push) or in cash to the driver upon destination arrival.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                <span className="font-bold text-slate-900">What is the 9922 shortcode phone number?</span>
                <p className="text-slate-600">9922 is Chebelew's 24/7 dedicated call center hotline in Ethiopia. Passengers without smartphones or internet access can call 9922 for instant manual dispatch.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                <span className="font-bold text-slate-900">How does the 15% VAT Regulation No. 570/2025 work?</span>
                <p className="text-slate-600">Per Federal Democratic Republic of Ethiopia regulations, a 15% VAT is calculated on the gross ride fare and remitted to the Ministry of Revenues. Electronic VAT tax receipts are automatically issued.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                <span className="font-bold text-slate-900">What happens if a parcel recipient does not have the dropoff OTP?</span>
                <p className="text-slate-600">The courier cannot mark the delivery as complete without the recipient's OTP. The recipient can request an instant SMS OTP resend from the Chebelew app.</p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 15: CONTACT */}
        {/* ======================================================== */}
        {currentPage === 'contact' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">Contact Chebelew</h2>
              <p className="text-xs text-slate-500 mt-1">Get in Touch with our Customer Experience, Corporate Sales, or Safety Teams.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-slate-700">
                  <MapPin className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900">Headquarters</span>
                    <span>Bole Medhanialem Mall, 4th Floor, Bole Sub-City, Addis Ababa, Ethiopia</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-slate-700">
                  <Phone className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900">Hotlines</span>
                    <span>Nationwide Shortcode: <strong>9922</strong> • Landline: +251 11 661 2345</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-slate-700">
                  <Mail className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900">Email Inquiries</span>
                    <span>support@chebelew.et • corporate@chebelew.et • developer@chebelew.et</span>
                  </div>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setContactSubmitted(true);
                }}
                className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-100"
              >
                {contactSubmitted ? (
                  <div className="text-emerald-700 font-bold p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                    <p>Thank you! Your message has been received.</p>
                    <p className="text-[11px] font-normal text-emerald-600">Our customer team will respond within 2 business hours.</p>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      required
                      placeholder="Your Full Name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full p-2.5 border rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Your Phone (+251 9...)"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full p-2.5 border rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                    <textarea
                      required
                      placeholder="How can our operations team assist you?"
                      rows={3}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full p-2.5 border rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs transition shadow-sm"
                    >
                      Send Message
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 16: HELP */}
        {/* ======================================================== */}
        {currentPage === 'help' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">24/7 Help & Support Center</h2>
              <p className="text-xs text-slate-500 mt-1">Resolution Guides for Common Travel, Payment, and Account Inquiries.</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-3">
              <LifeBuoy className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <strong>Need immediate phone assistance?</strong> Call <strong>9922</strong> from any mobile or landline network in Ethiopia.
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="font-bold text-slate-900">Lost and Found Item Recovery</span>
                <p className="text-slate-500">Left a phone, bag, or umbrella in a taxi? Report your trip ID or phone number to 9922. Driver contact is mediated immediately.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="font-bold text-slate-900">Fare Discrepancy Inquiries</span>
                <p className="text-slate-500">Every route is metered per kilometer and minute. Disputed routes are audited using GPS coordinate logs with instant refunds if appropriate.</p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 17: PRIVACY */}
        {/* ======================================================== */}
        {currentPage === 'privacy' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">Privacy Policy</h2>
              <p className="text-xs text-slate-500 mt-1">Last Updated: November 2026. Chebelew Technologies Ethiopia PLC.</p>
            </div>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                Chebelew Technologies Ethiopia PLC ("Chebelew", "we", "our") is dedicated to protecting the privacy and personal data of our riders, drivers, couriers, and corporate partners.
              </p>
              <h4 className="font-bold text-slate-900">1. Information We Collect</h4>
              <p>
                We collect location telemetry (GPS coordinates) strictly during active trip requests and in-transit deliveries to calculate road distances, compute fares, and ensure rider safety. Driver location telemetry is transmitted while the driver is toggled online.
              </p>
              <h4 className="font-bold text-slate-900">2. Telebirr Payment Information</h4>
              <p>
                Chebelew does not store sensitive banking passwords or Telebirr PINs. All mobile money transactions are securely tokenized through Ethio Telecom's official payment gateway.
              </p>
              <h4 className="font-bold text-slate-900">3. Data Sharing & Security</h4>
              <p>
                Personal data is never sold to third parties. Data is shared with the Ethiopian Federal Police or judiciary strictly pursuant to a lawful court order or in response to an active emergency SOS alert.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 18: TERMS */}
        {/* ======================================================== */}
        {currentPage === 'terms' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">Terms of Service</h2>
              <p className="text-xs text-slate-500 mt-1">User Agreement for Passengers, Drivers, and Commercial Partners.</p>
            </div>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <h4 className="font-bold text-slate-900">1. Acceptance of Terms</h4>
              <p>
                By downloading, accessing, or using the Chebelew mobile applications, dispatch hotlines (9922), or web platform, you agree to be bound by these Terms of Service.
              </p>
              <h4 className="font-bold text-slate-900">2. Passenger Obligations</h4>
              <p>
                Passengers must treat drivers with respect, refrain from transporting illegal or hazardous contraband, and settle all metered trip fares upon arrival via Telebirr or cash.
              </p>
              <h4 className="font-bold text-slate-900">3. Driver Obligations</h4>
              <p>
                Drivers must maintain active vehicle insurance, hold a valid commercial driving license, adhere to all Ethiopian road traffic safety codes, and charge only regulated meter rates.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 19: DRIVER AGREEMENT */}
        {/* ======================================================== */}
        {currentPage === 'driver_agreement' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">Driver Subscription Agreement</h2>
              <p className="text-xs text-slate-500 mt-1">Governing Terms for Independent Subscribed Transportation Partners.</p>
            </div>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                1. <strong>Independent Contractor Status:</strong> The Driver acknowledges and agrees that they operate as an independent transportation provider and not an employee of Chebelew.
              </p>
              <p>
                2. <strong>Founder Mandate 0% Commission:</strong> Chebelew covenants that it shall not deduct any per-trip percentage commission from independent subscribed driver fares. All metered gross fares belong 100% to the driver.
              </p>
              <p>
                3. <strong>Subscription Entitlement:</strong> Drivers must maintain an active Daily, Weekly, Monthly, Quarterly, or Yearly subscription pass to access incoming dispatches. A 24-hour grace period is granted following expiration before dispatches pause.
              </p>
              <p>
                4. <strong>Statutory Tax Compliance:</strong> In accordance with Ethiopian VAT Regulation No. 570/2025, the 15% VAT component collected from passengers is remitted to the Ministry of Revenues.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 20: PARTNER AGREEMENT */}
        {/* ======================================================== */}
        {currentPage === 'partner_agreement' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">Commercial Partner Agreement</h2>
              <p className="text-xs text-slate-500 mt-1">Master Services Agreement for Transportation Aggregator Partners.</p>
            </div>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                This Commercial Partner Agreement governs the technical integration, API availability, and mutual dispatching terms between Chebelew Technologies Ethiopia PLC and authorized fleet operators.
              </p>
              <p>
                <strong>Uptime Commitment:</strong> Both parties warrant maintaining an API service level availability of at least 99.5% excluding scheduled maintenance windows.
              </p>
              <p>
                <strong>Settlement Terms:</strong> Aggregated booking fees are reconciled weekly and settled electronically via Telebirr or national bank transfer within 3 business days of reconciliation.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 21: SAFETY */}
        {/* ======================================================== */}
        {currentPage === 'safety' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">Safety & Emergency Response Protocol</h2>
              <p className="text-xs text-slate-500 mt-1">Passenger Protection, Driver Security, and Federal Emergency Integration.</p>
            </div>
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2">
              <div className="font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span className="text-sm">Ethiopian Emergency Hotlines</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1 font-bold">
                <div>Federal Police: <strong>991</strong></div>
                <div>Ambulance (Red Cross): <strong>907</strong></div>
                <div>Fire & Emergency: <strong>939</strong></div>
              </div>
            </div>
            <div className="space-y-3 text-xs text-slate-600">
              <h4 className="font-bold text-slate-900">The Chebelew In-App Panic Protocol</h4>
              <p>
                When a passenger or driver taps the SOS button:
              </p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Vehicle live coordinates are immediately locked and transmitted to the Chebelew Safety Center.</li>
                <li>The closest Ethiopian Police Sector station is notified with the vehicle's plate number and driver identity.</li>
                <li>The trip record is marked with an OPEN emergency incident requiring formal supervisor resolution.</li>
              </ol>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 22: CANCELLATION */}
        {/* ======================================================== */}
        {currentPage === 'cancellation' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">Cancellation & Refund Policy</h2>
              <p className="text-xs text-slate-500 mt-1">Fair and Balanced Cancellation Rules for Passengers and Drivers.</p>
            </div>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <h4 className="font-bold text-slate-900">1. Free Cancellation Window</h4>
              <p>
                Passengers may cancel any trip request free of charge within <strong>2 minutes</strong> of driver assignment.
              </p>
              <h4 className="font-bold text-slate-900">2. Late Cancellation Fee</h4>
              <p>
                If a passenger cancels after 2 minutes or after the driver has arrived at the pickup location, a nominal cancellation fee of <strong>50 ETB</strong> is applied. 100% of this fee is credited directly to the driver to compensate for fuel expenditure and travel time.
              </p>
              <h4 className="font-bold text-slate-900">3. Driver No-Show Policy</h4>
              <p>
                Drivers must wait at least 5 minutes at the designated pickup address before marking a rider as a no-show. Drivers who cancel prematurely without contacting the passenger face automatic dispatch cooldown penalties.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Public Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 p-8 text-xs">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold text-white text-sm">Chebelew ከበለው</div>
            <div className="text-slate-400 text-[11px]">Ethiopia Mobility-as-a-Service (MaaS) Platform</div>
          </div>
          <div className="flex flex-wrap gap-4 text-slate-400 text-[11px]">
            <button onClick={() => setCurrentPage('about')} className="hover:text-white">About</button>
            <button onClick={() => setCurrentPage('drivers')} className="hover:text-white">Drivers (0%)</button>
            <button onClick={() => setCurrentPage('subscriptions')} className="hover:text-white">Plans</button>
            <button onClick={() => setCurrentPage('delivery')} className="hover:text-white">Delivery</button>
            <button onClick={() => setCurrentPage('developers')} className="hover:text-white">Developers</button>
            <button onClick={() => setCurrentPage('privacy')} className="hover:text-white">Privacy</button>
            <button onClick={() => setCurrentPage('terms')} className="hover:text-white">Terms</button>
            <button onClick={() => setCurrentPage('safety')} className="hover:text-white">Safety (991)</button>
          </div>
          <div className="text-slate-500 text-[11px]">
            © 2026 Chebelew Technologies Ethiopia PLC.
          </div>
        </div>
      </footer>
    </div>
  );
};
