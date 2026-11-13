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
} from 'lucide-react';
import { Language } from '../../i18n/translations';

interface PublicWebsiteProps {
  language: Language;
  onNavigateToApp: (role: 'rider' | 'driver' | 'admin' | 'split') => void;
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
}) => {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

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
      <nav className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm tracking-tight text-white flex items-center gap-1.5 cursor-pointer" onClick={() => setCurrentPage('home')}>
              <span className="text-amber-400">Chebelew</span>
              <span className="text-[10px] bg-brand-600 px-1.5 py-0.5 rounded font-mono">PORTAL</span>
            </span>
          </div>

          {/* Quick Page Picker Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value as PageId)}
                className="bg-slate-800 text-white text-xs font-bold rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                {['Core', 'Products', 'Pricing', 'Business', 'Partners', 'Technology', 'Company', 'Support', 'Legal'].map((cat) => (
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
              className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
            >
              Launch App
            </button>
          </div>
        </div>
      </nav>

      {/* Main Page Content Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* PAGE 1: HOME */}
        {currentPage === 'home' && (
          <div className="space-y-12">
            {/* Hero */}
            <div className="text-center space-y-4 py-8">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full border border-amber-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Ethiopia's Unified Mobility & Delivery Ecosystem</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Move Faster. Compare Fares. <br />
                <span className="text-brand-600">Zero Commission for Drivers.</span>
              </h1>
              <p className="text-base text-slate-600 max-w-2xl mx-auto">
                Chebelew combines ride-hailing aggregation (RIDE, Feres, ZayRide), independent driver dispatching, parcel logistics, and corporate mobility into one unified platform.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => onNavigateToApp('rider')}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg transition"
                >
                  Book a Ride Now
                </button>
                <button
                  onClick={() => onNavigateToApp('driver')}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition"
                >
                  Drive with 0% Commission
                </button>
              </div>
            </div>

            {/* 3 Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="p-3 bg-brand-50 text-brand-700 rounded-xl w-fit">
                  <Car className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Multi-Provider Aggregator</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Search pickup to dropoff once. Compare estimated prices and ETAs across Chebelew, RIDE, and Feres in real time.
                </p>
                <button onClick={() => setCurrentPage('passengers')} className="text-brand-600 font-bold text-xs flex items-center gap-1">
                  Learn more <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="p-3 bg-amber-50 text-amber-700 rounded-xl w-fit">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Driver Subscription Model</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Zero commission on trips. Drivers pay transparent daily, weekly, or monthly subscriptions and keep 100% of their net earnings.
                </p>
                <button onClick={() => setCurrentPage('subscriptions')} className="text-brand-600 font-bold text-xs flex items-center gap-1">
                  View plans <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="p-3 bg-purple-50 text-purple-700 rounded-xl w-fit">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Dual-OTP Express Logistics</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Deliver packages, legal documents, food and groceries with 4-digit pickup and dropoff OTP verification and digital proof of delivery.
                </p>
                <button onClick={() => setCurrentPage('delivery')} className="text-brand-600 font-bold text-xs flex items-center gap-1">
                  Explore delivery <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 2: ABOUT */}
        {currentPage === 'about' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-slate-900">About Chebelew Mobility Platform</h2>
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                Founded in Addis Ababa, Ethiopia, Chebelew is engineered to transform African urban transportation into an open, efficient, and equitable Mobility-as-a-Service (MaaS) ecosystem.
              </p>
              <p>
                Traditional ride-hailing applications extract high percentages (15% to 25%) from driver earnings on every single ride, creating economic strain on operators and inflation in passenger fares. Chebelew fundamentally alters this dynamic by establishing a <strong>pure subscription business model</strong> for independent drivers alongside open multi-provider fare comparison.
              </p>
              <h3 className="text-sm font-bold text-slate-900 pt-2">Our Mission</h3>
              <p>
                To provide transparent, dependable, and dignified mobility for millions of passengers while granting drivers unlimited earnings potential under fair and transparent operating rules.
              </p>
              <h3 className="text-sm font-bold text-slate-900 pt-2">Regulatory Alignment</h3>
              <p>
                Chebelew operates in full compliance with the Federal Democratic Republic of Ethiopia Ministry of Revenues Value Added Tax Regulation No. 570/2025 (15% VAT on platform rides) and Addis Ababa Transport Bureau directives.
              </p>
            </div>
          </div>
        )}

        {/* PAGE 3: HOW IT WORKS */}
        {currentPage === 'how_it_works' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-slate-900">How Chebelew Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
              <div className="space-y-3 border-r md:pr-6 border-slate-100">
                <span className="font-bold text-sm text-brand-600 block">For Passengers</span>
                <ol className="list-decimal pl-4 space-y-2">
                  <li><strong>Enter Route:</strong> Choose pickup and destination points in Addis Ababa.</li>
                  <li><strong>Compare Options:</strong> View live offers across Chebelew Sedan, Minivan XL, Executive Comfort, and external partners.</li>
                  <li><strong>Instant Dispatch:</strong> Closest vetted driver is matched within seconds.</li>
                  <li><strong>Seamless Telebirr:</strong> Pay with 1-click Telebirr or cash with an instant 15% VAT electronic receipt.</li>
                </ol>
              </div>

              <div className="space-y-3">
                <span className="font-bold text-sm text-amber-600 block">For Drivers</span>
                <ol className="list-decimal pl-4 space-y-2">
                  <li><strong>Subscribe:</strong> Pick a flat plan (Daily, Weekly, Monthly) via Telebirr or Cash.</li>
                  <li><strong>Go Online:</strong> Receive unlimited trip and delivery dispatches in your area.</li>
                  <li><strong>Zero Commission:</strong> Keep 100% of rider fares! Only statutory 15% VAT applies.</li>
                  <li><strong>Instant Payout:</strong> Withdraw earnings directly to Telebirr 24/7 with zero waiting.</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 4: PASSENGERS */}
        {currentPage === 'passengers' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Passenger & Rider Experience</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="font-bold text-slate-900">Zero Surge Gouging</span>
                <p className="text-slate-500">Transparent tariffs regulated with the City of Addis Ababa Transport Bureau.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="font-bold text-slate-900">Bilingual Interface</span>
                <p className="text-slate-500">Full Amharic (አማርኛ), English, Afaan Oromo, and Tigrinya support.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="font-bold text-slate-900">Safety Panic Button</span>
                <p className="text-slate-500">Instant SOS trigger alerting Ethiopian Federal Police 991 and safety teams.</p>
              </div>
            </div>
            <button onClick={() => onNavigateToApp('rider')} className="px-6 py-2.5 bg-brand-600 text-white font-bold rounded-xl text-xs">
              Open Passenger Web App
            </button>
          </div>
        )}

        {/* PAGE 5: DRIVERS */}
        {currentPage === 'drivers' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">Drive with Chebelew</h2>
              <p className="text-xs text-amber-700 font-bold mt-1">Founder Mandate: 0% Per-Trip Platform Commission Guarantee</p>
            </div>
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                At Chebelew, we believe drivers are business partners, not commodities. When you complete a 500 ETB ride, you shouldn't have to surrender 100 ETB or 125 ETB in platform commission.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="font-bold text-emerald-900 block mb-1">Chebelew Subscription Model</span>
                  <ul className="space-y-1 text-emerald-800">
                    <li>• Flat subscription (from 50 ETB/day or 1,000 ETB/month)</li>
                    <li>• Unlimited trips accepted</li>
                    <li>• Zero commission deduction (0%)</li>
                    <li>• Keep 100% of all gross fares</li>
                  </ul>
                </div>
                <div className="p-4 bg-slate-100 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-1">Traditional Ride-Hailing Apps</span>
                  <ul className="space-y-1 text-slate-600">
                    <li>• 15% to 25% deducted on every single trip</li>
                    <li>• The harder you work, the more you lose</li>
                    <li>• Unpredictable penalties & commission creep</li>
                  </ul>
                </div>
              </div>
            </div>
            <button onClick={() => onNavigateToApp('driver')} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs">
              Go to Driver Portal
            </button>
          </div>
        )}

        {/* PAGE 6: SUBSCRIPTIONS */}
        {currentPage === 'subscriptions' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Driver Subscription Pricing Plans</h2>
            <p className="text-xs text-slate-500">Configured for Addis Ababa, Ethiopia (ETB). No per-trip commission charged.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-5 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-700 block">Daily Access</span>
                <div className="text-2xl font-black text-slate-900">50 ETB <span className="text-xs font-normal text-slate-500">/ 1 day</span></div>
                <p className="text-slate-500">Ideal for part-time drivers testing the platform. 0% trip commission.</p>
              </div>
              <div className="p-5 rounded-xl border-2 border-brand-500 bg-brand-50/20 space-y-3">
                <span className="font-bold text-brand-700 block">Weekly Flex (Popular)</span>
                <div className="text-2xl font-black text-slate-900">300 ETB <span className="text-xs font-normal text-slate-500">/ 7 days</span></div>
                <p className="text-slate-500">7 days of unlimited ride & delivery opportunities. Paid via Telebirr.</p>
              </div>
              <div className="p-5 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-700 block">Monthly Pro (Best Value)</span>
                <div className="text-2xl font-black text-slate-900">1,000 ETB <span className="text-xs font-normal text-slate-500">/ 30 days</span></div>
                <p className="text-slate-500">Full-time professional drivers keeping 100% of all fares for an entire month.</p>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 7: FLEETS */}
        {currentPage === 'fleets' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Fleets & Cooperative Associations</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Chebelew partners with taxi associations, blue-and-white meter taxi unions, and commercial fleet owners across Addis Ababa. Register your fleet to manage drivers, monitor live GPS positions, and track collective revenues through our multi-tenant fleet dashboard.
            </p>
          </div>
        )}

        {/* PAGE 8: CORPORATE */}
        {currentPage === 'corporate' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Corporate Mobility & SaaS</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Provide safe, reliable transportation for your enterprise team with monthly credit limits, electronic VAT invoices, and automated travel allowance debits. Trusted by banks, embassies, and Ethiopian enterprises.
            </p>
          </div>
        )}

        {/* PAGE 9: DELIVERY */}
        {currentPage === 'delivery' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Chebelew Express Delivery & Logistics</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Send documents, merchandise, parcels, food and groceries with our industry-first <strong>Dual-OTP Protection</strong>. Drivers verify a 4-digit code at pickup from the sender and a 4-digit code at dropoff from the recipient, accompanied by photo proof of delivery.
            </p>
          </div>
        )}

        {/* PAGE 10: PARTNERS */}
        {currentPage === 'partners' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Aggregator Partner Program</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Chebelew is designed to complement existing operators like RIDE, Feres, and ZayRide. Through official API integration, partner operators gain access to incremental demand while passengers enjoy one unified search experience.
            </p>
          </div>
        )}

        {/* PAGE 11: PROVIDERS */}
        {currentPage === 'providers' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Provider Integration Portal</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Technical documentation and partner certification for transportation operators connecting their dispatch backends to Chebelew's aggregator engine.
            </p>
          </div>
        )}

        {/* PAGE 12: DEVELOPERS */}
        {currentPage === 'developers' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Developer API & Webhooks</h2>
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] space-y-2">
              <div className="text-brand-400 font-bold"># Chebelew OpenAPI v3 Dispatch Endpoint</div>
              <div>POST /api/v1/dispatch/rides</div>
              <div>Authorization: Bearer chebelew_dev_test_key_001</div>
              <div className="text-slate-500">{"{ pickup: { lat: 8.995, lng: 38.788 }, category: 'sedan' }"}</div>
            </div>
            <p className="text-xs text-slate-600">
              Integrate ride booking, delivery dispatching, and fare estimation directly into your e-commerce platform, corporate ERP, or mobile app.
            </p>
          </div>
        )}

        {/* PAGE 13: BLOG */}
        {currentPage === 'blog' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Newsroom & Mobility Insights</h2>
            <div className="space-y-4 text-xs">
              <div className="border-b pb-3">
                <span className="text-[10px] text-brand-600 font-bold uppercase">Press Release</span>
                <h4 className="font-bold text-sm text-slate-900 mt-0.5">Chebelew Launches 0% Driver Subscription Model in Addis Ababa</h4>
                <p className="text-slate-500 mt-1">Transforming driver take-home earnings and pioneering fair mobility in the Horn of Africa.</p>
              </div>
              <div className="border-b pb-3">
                <span className="text-[10px] text-emerald-600 font-bold uppercase">Regulatory Compliance</span>
                <h4 className="font-bold text-sm text-slate-900 mt-0.5">Compliance with FDRE VAT Regulation No. 570/2025</h4>
                <p className="text-slate-500 mt-1">Automating 15% VAT calculation and instant receipts across all digital and cash transactions.</p>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 14: FAQ */}
        {currentPage === 'faq' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Frequently Asked Questions</h2>
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                <span className="font-bold text-slate-900">Does Chebelew charge any commission to subscribed drivers?</span>
                <p className="text-slate-600">No. Under the Founder Mandate, Chebelew independent drivers pay zero per-trip commission. Drivers keep 100% of their net earnings.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                <span className="font-bold text-slate-900">How do passengers pay?</span>
                <p className="text-slate-600">Passengers can pay digitally via Ethio Telecom Telebirr (USSD / QR code) or directly in cash to the driver upon destination arrival.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                <span className="font-bold text-slate-900">What is the 9922 phone number?</span>
                <p className="text-slate-600">9922 is Chebelew's 24/7 manual phone booking and support hotline for callers without smartphones or internet access.</p>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 15: CONTACT */}
        {currentPage === 'contact' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Contact Chebelew</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Bole Medhanialem Mall, 4th Floor, Addis Ababa, Ethiopia</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Hotline: 9922 • Office: +251 11 661 2345</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>support@chebelew.et • contact@chebelew.et</span>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setContactSubmitted(true);
                }}
                className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100"
              >
                {contactSubmitted ? (
                  <div className="text-emerald-700 font-bold p-3 bg-emerald-50 rounded-lg">
                    Thank you! Your inquiry has been routed to our team.
                  </div>
                ) : (
                  <>
                    <input type="text" required placeholder="Your Name" className="w-full p-2 border rounded-lg text-xs" />
                    <input type="text" required placeholder="Your Phone (+251...)" className="w-full p-2 border rounded-lg text-xs" />
                    <textarea required placeholder="How can we assist you?" rows={3} className="w-full p-2 border rounded-lg text-xs" />
                    <button type="submit" className="w-full py-2 bg-brand-600 text-white font-bold rounded-lg text-xs">
                      Send Message
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>
        )}

        {/* PAGE 16: HELP */}
        {currentPage === 'help' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-slate-900">24/7 Help & Support Center</h2>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
              Need immediate assistance with a current ride, lost item, or fare discrepancy? Call <strong>9922</strong> from any phone in Ethiopia.
            </div>
          </div>
        )}

        {/* PAGE 17: PRIVACY */}
        {currentPage === 'privacy' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Privacy Policy</h2>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>Last updated: November 2026. Chebelew respects your personal privacy.</p>
              <p>We collect location telemetry strictly during active ride dispatches to calculate accurate fares and protect passenger and driver safety.</p>
              <p>Phone numbers are masked when possible to safeguard user confidentiality.</p>
            </div>
          </div>
        )}

        {/* PAGE 18: TERMS */}
        {currentPage === 'terms' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Terms of Service</h2>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>By accessing Chebelew via mobile application or web portal, you agree to comply with all platform conduct rules, applicable road traffic laws, and Ethiopian statutory regulations.</p>
            </div>
          </div>
        )}

        {/* PAGE 19: DRIVER AGREEMENT */}
        {currentPage === 'driver_agreement' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Driver Subscription Agreement</h2>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>1. <strong>Independent Contractor:</strong> Subscribed drivers operate as independent transportation professionals.</p>
              <p>2. <strong>0% Commission Guarantee:</strong> Chebelew warrants that no per-trip commission shall be deducted from independent subscribed driver fares.</p>
              <p>3. <strong>Entitlement Period:</strong> Access to dispatches requires an active Daily, Weekly, Monthly, Quarterly, or Yearly subscription plan.</p>
            </div>
          </div>
        )}

        {/* PAGE 20: PARTNER AGREEMENT */}
        {currentPage === 'partner_agreement' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Commercial Partner Agreement</h2>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>Governing commercial terms, SLA uptime requirements, and mutual dispatch agreements between Chebelew and authorized third-party transportation operators.</p>
            </div>
          </div>
        )}

        {/* PAGE 21: SAFETY */}
        {currentPage === 'safety' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Safety & Emergency Protocol</h2>
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2">
              <div className="font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Police Hotline: 991 (Federal Police & Addis Ababa Police)</span>
              </div>
              <p>Every vehicle on Chebelew must pass an annual roadworthiness inspection by the Transport Bureau. Drivers undergo identity verification (KYC), criminal background checks, and driving license validation.</p>
            </div>
          </div>
        )}

        {/* PAGE 22: CANCELLATION */}
        {currentPage === 'cancellation' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Cancellation & Refund Policy</h2>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>Passengers may cancel free of charge within 2 minutes of dispatch. Late cancellations after driver arrival incur a nominal compensation fee paid directly to the driver for fuel and time expenditure.</p>
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
            <button onClick={() => setCurrentPage('privacy')} className="hover:text-white">Privacy</button>
            <button onClick={() => setCurrentPage('terms')} className="hover:text-white">Terms</button>
            <button onClick={() => setCurrentPage('safety')} className="hover:text-white">Safety (991)</button>
          </div>
          <div className="text-slate-500 text-[11px]">
            © 2026 Chebelew. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
