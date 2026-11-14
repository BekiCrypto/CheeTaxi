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
  ChevronRight,
  Sparkles,
  UserCheck,
  Compass,
  X,
  Share2,
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

  React.useEffect(() => {
    if (initialPageId) {
      setCurrentPage(initialPageId as PageId);
    }
  }, [initialPageId]);

  const [activeMenuDropdown, setActiveMenuDropdown] = useState<string | null>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [ticketIdCreated, setTicketIdCreated] = useState<string | null>(null);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
  });

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.phone || !contactForm.message) return;
    setIsSubmittingContact(true);
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: `visitor_${Date.now()}`,
          userName: contactForm.name || 'Web Visitor',
          userPhone: contactForm.phone,
          userRole: 'rider',
          category: contactForm.subject.toLowerCase().includes('dispute') ? 'fare_dispute' : 'app_issue',
          subject: contactForm.subject,
          message: `${contactForm.message} [Email: ${contactForm.email || 'N/A'}]`,
        }),
      });
      const data = await res.json();
      if (data.ticket) {
        setTicketIdCreated(data.ticket.id);
        setContactSubmitted(true);
      } else {
        setContactSubmitted(true);
      }
    } catch (err) {
      console.error('Contact submit error:', err);
      setContactSubmitted(true);
    } finally {
      setIsSubmittingContact(false);
    }
  };

  // Demo route estimator on homepage
  const [demoPickup, setDemoPickup] = useState('Bole Medhanialem Mall');
  const [demoDropoff, setDemoDropoff] = useState('Meskel Square');

  const navigateTo = (page: PageId) => {
    setCurrentPage(page);
    setActiveMenuDropdown(null);
    window.history.pushState({}, '', page === 'home' ? '/portal' : `/portal/${page}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-full flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-brand-500 selection:text-white">
      {/* ======================================================== */}
      {/* 1. PROFESSIONAL EXECUTIVE HEADER & MEGA-NAVIGATION */}
      {/* ======================================================== */}
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo Brandmark */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigateTo('home')}
            >
              <img
                src="/chebelew-logo.svg"
                alt="Chebelew Logo"
                className="w-10 h-10 drop-shadow-sm group-hover:scale-105 transition transform"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white font-sans">
                    Chebelew
                  </span>
                  <span className="font-bold text-xs text-amber-400 font-sans">
                    ቼበለው
                  </span>
                  <div className="flex h-3 w-4 rounded-xs overflow-hidden ml-1 border border-white/20">
                    <div className="w-1/3 bg-[#078930]" />
                    <div className="w-1/3 bg-[#fcdd09]" />
                    <div className="w-1/3 bg-[#da121a]" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium tracking-tight">
                  Ethiopia Mobility-as-a-Service
                </span>
              </div>
            </div>

            {/* Desktop Navigation Menus */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-semibold">
              <button
                onClick={() => navigateTo('home')}
                className={`px-3 py-2 rounded-lg transition ${
                  currentPage === 'home' ? 'text-amber-400 bg-slate-900 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                Home
              </button>

              {/* Menu: Riders & Mobility */}
              <div
                className="relative"
                onMouseEnter={() => setActiveMenuDropdown('riders')}
                onMouseLeave={() => setActiveMenuDropdown(null)}
              >
                <button
                  className={`px-3 py-2 rounded-lg flex items-center gap-1 transition ${
                    ['passengers', 'how_it_works', 'safety', 'cancellation'].includes(currentPage)
                      ? 'text-amber-400 bg-slate-900 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span>Passengers</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>
                {activeMenuDropdown === 'riders' && (
                  <div className="absolute top-full left-0 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-2 space-y-1 text-xs z-50">
                    <button
                      onClick={() => navigateTo('passengers')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <Smartphone className="w-4 h-4 text-brand-400" />
                      <div>
                        <div className="font-bold">Passenger Experience</div>
                        <div className="text-[10px] text-slate-400">Book, track, compare fares</div>
                      </div>
                    </button>
                    <button
                      onClick={() => navigateTo('how_it_works')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="font-bold">How It Works</div>
                        <div className="text-[10px] text-slate-400">4-step dispatch workflow</div>
                      </div>
                    </button>
                    <button
                      onClick={() => navigateTo('safety')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-bold">Safety & SOS 991</div>
                        <div className="text-[10px] text-slate-400">Police emergency integration</div>
                      </div>
                    </button>
                    <button
                      onClick={() => navigateTo('cancellation')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-rose-400" />
                      <div>
                        <div className="font-bold">Cancellation Rules</div>
                        <div className="text-[10px] text-slate-400">Fair passenger & driver policy</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Menu: Drivers & Earnings */}
              <div
                className="relative"
                onMouseEnter={() => setActiveMenuDropdown('drivers')}
                onMouseLeave={() => setActiveMenuDropdown(null)}
              >
                <button
                  className={`px-3 py-2 rounded-lg flex items-center gap-1 transition ${
                    ['drivers', 'subscriptions', 'driver_agreement'].includes(currentPage)
                      ? 'text-amber-400 bg-slate-900 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span>Drivers (0% Comm)</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>
                {activeMenuDropdown === 'drivers' && (
                  <div className="absolute top-full left-0 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-2 space-y-1 text-xs z-50">
                    <button
                      onClick={() => navigateTo('drivers')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <Car className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-bold">0% Commission Model</div>
                        <div className="text-[10px] text-slate-400">Keep 100% of metered fares</div>
                      </div>
                    </button>
                    <button
                      onClick={() => navigateTo('subscriptions')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="font-bold">Driver Subscription Plans</div>
                        <div className="text-[10px] text-slate-400">Daily, weekly, monthly passes</div>
                      </div>
                    </button>
                    <button
                      onClick={() => navigateTo('driver_agreement')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <FileCheck className="w-4 h-4 text-indigo-400" />
                      <div>
                        <div className="font-bold">Driver Agreement</div>
                        <div className="text-[10px] text-slate-400">Operating covenants & rights</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Menu: Business & Fleets */}
              <div
                className="relative"
                onMouseEnter={() => setActiveMenuDropdown('business')}
                onMouseLeave={() => setActiveMenuDropdown(null)}
              >
                <button
                  className={`px-3 py-2 rounded-lg flex items-center gap-1 transition ${
                    ['corporate', 'delivery', 'fleets', 'partner_agreement'].includes(currentPage)
                      ? 'text-amber-400 bg-slate-900 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span>Business</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>
                {activeMenuDropdown === 'business' && (
                  <div className="absolute top-full left-0 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-2 space-y-1 text-xs z-50">
                    <button
                      onClick={() => navigateTo('corporate')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <Briefcase className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="font-bold">Corporate Accounts</div>
                        <div className="text-[10px] text-slate-400">Monthly billing & staff allowances</div>
                      </div>
                    </button>
                    <button
                      onClick={() => navigateTo('delivery')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <Package className="w-4 h-4 text-purple-400" />
                      <div>
                        <div className="font-bold">Dual-OTP Express Logistics</div>
                        <div className="text-[10px] text-slate-400">Secure parcel & document delivery</div>
                      </div>
                    </button>
                    <button
                      onClick={() => navigateTo('fleets')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <Building2 className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="font-bold">Fleets & Taxi Co-ops</div>
                        <div className="text-[10px] text-slate-400">Cooperative fleet onboarding</div>
                      </div>
                    </button>
                    <button
                      onClick={() => navigateTo('partner_agreement')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-bold">Commercial Terms</div>
                        <div className="text-[10px] text-slate-400">B2B transportation agreement</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Menu: Network & Technology */}
              <div
                className="relative"
                onMouseEnter={() => setActiveMenuDropdown('network')}
                onMouseLeave={() => setActiveMenuDropdown(null)}
              >
                <button
                  className={`px-3 py-2 rounded-lg flex items-center gap-1 transition ${
                    ['partners', 'providers', 'developers'].includes(currentPage)
                      ? 'text-amber-400 bg-slate-900 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span>Network & APIs</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>
                {activeMenuDropdown === 'network' && (
                  <div className="absolute top-full left-0 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-2 space-y-1 text-xs z-50">
                    <button
                      onClick={() => navigateTo('partners')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <Layers className="w-4 h-4 text-brand-400" />
                      <div>
                        <div className="font-bold">Fleet Aggregator Engine</div>
                        <div className="text-[10px] text-slate-400">Multi-provider architecture</div>
                      </div>
                    </button>
                    <button
                      onClick={() => navigateTo('providers')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-bold">Provider Adapter Console</div>
                        <div className="text-[10px] text-slate-400">Circuit breakers & failover</div>
                      </div>
                    </button>
                    <button
                      onClick={() => navigateTo('developers')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <Code className="w-4 h-4 text-purple-400" />
                      <div>
                        <div className="font-bold">Developers & OpenAPI 3.0</div>
                        <div className="text-[10px] text-slate-400">REST API keys & SDK docs</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Menu: Company & Legal */}
              <div
                className="relative"
                onMouseEnter={() => setActiveMenuDropdown('company')}
                onMouseLeave={() => setActiveMenuDropdown(null)}
              >
                <button
                  className={`px-3 py-2 rounded-lg flex items-center gap-1 transition ${
                    ['about', 'blog', 'faq', 'contact', 'help', 'privacy', 'terms'].includes(currentPage)
                      ? 'text-amber-400 bg-slate-900 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span>Company</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>
                {activeMenuDropdown === 'company' && (
                  <div className="absolute top-full right-0 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-2 space-y-1 text-xs z-50">
                    <button
                      onClick={() => navigateTo('about')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <Award className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="font-bold">About Chebelew ቼበለው</div>
                        <div className="text-[10px] text-slate-400">Mission, founders & vision</div>
                      </div>
                    </button>
                    <button
                      onClick={() => navigateTo('privacy')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-bold">Privacy Policy</div>
                        <div className="text-[10px] text-slate-400">Data protection & Telebirr safety</div>
                      </div>
                    </button>
                    <button
                      onClick={() => navigateTo('terms')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <FileCheck className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="font-bold">Terms of Service</div>
                        <div className="text-[10px] text-slate-400">Contractual terms & rules</div>
                      </div>
                    </button>
                    <button
                      onClick={() => navigateTo('contact')}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4 text-brand-400" />
                      <div>
                        <div className="font-bold">Contact & Support (9922)</div>
                        <div className="text-[10px] text-slate-400">24/7 Addis hotline & email</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </nav>

            {/* Quick Action CTAs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateToApp('driver')}
                className="hidden sm:flex px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold rounded-lg border border-slate-800 transition items-center gap-1.5"
              >
                <Car className="w-3.5 h-3.5 text-amber-400" />
                <span>Driver Portal</span>
              </button>
              <button
                onClick={() => onNavigateToApp('rider')}
                className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Passenger App</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb banner when on deep subpages */}
      {currentPage !== 'home' && (
        <div className="bg-slate-100 border-b border-slate-200 py-2.5 px-4 md:px-8 text-xs font-mono text-slate-500">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <span
                onClick={() => navigateTo('home')}
                className="hover:text-slate-900 cursor-pointer font-bold"
              >
                Home
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-900 font-bold uppercase truncate">
                {currentPage.replace(/_/g, ' ')}
              </span>
            </div>
            <button
              onClick={() => navigateTo('home')}
              className="text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1 shrink-0"
            >
              <span>← Back to Overview</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MAIN PAGE BODY CONTENT */}
      {/* ======================================================== */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-10 space-y-12">
        {/* ======================================================== */}
        {/* PAGE 1: HOME */}
        {/* ======================================================== */}
        {currentPage === 'home' && (
          <div className="space-y-14">
            {/* Hero Section */}
            <div className="text-center space-y-5 py-6 md:py-10">
              <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-900 text-xs font-black px-3.5 py-1 rounded-full border border-amber-300 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Ethiopia's Unified Mobility & Logistics Ecosystem • ቼበለው</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-950 tracking-tight leading-tight max-w-4xl mx-auto">
                Move Faster. Compare Cabs. <br />
                <span className="bg-gradient-to-r from-brand-600 via-teal-600 to-indigo-600 bg-clip-text text-transparent">
                  Zero Commission for Drivers.
                </span>
              </h1>

              <p className="text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Chebelew ቼበለው aggregates licensed taxi networks, municipal cab cooperatives, and independent drivers across Addis Ababa into one unified app. Fair meter rates, 0% driver exploitation, and 15% VAT compliant.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => onNavigateToApp('rider')}
                  className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl shadow-lg transition flex items-center gap-2 text-xs md:text-sm"
                >
                  <Smartphone className="w-4 h-4 text-brand-400" />
                  <span>Book a Ride (Passenger App)</span>
                </button>

                <button
                  onClick={() => onNavigateToApp('driver')}
                  className="px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-extrabold rounded-xl shadow-lg transition flex items-center gap-2 text-xs md:text-sm"
                >
                  <Car className="w-4 h-4" />
                  <span>Drive with 0% Commission</span>
                </button>

                <button
                  onClick={() => navigateTo('about')}
                  className="px-5 py-3.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-300 shadow-xs transition flex items-center gap-1.5 text-xs md:text-sm"
                >
                  <span>Learn More</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Live Operational Metrics Ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-2xl shadow-md border border-slate-800">
              <div className="text-center space-y-1 border-r border-slate-800/80">
                <div className="text-3xl font-black text-amber-400">0%</div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Driver Commission</div>
                <div className="text-[10px] text-slate-500">100% earnings retention</div>
              </div>

              <div className="text-center space-y-1 border-r border-slate-800/80">
                <div className="text-3xl font-black text-white">4.2 min</div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Average Addis ETA</div>
                <div className="text-[10px] text-slate-500">Multi-fleet dispatching</div>
              </div>

              <div className="text-center space-y-1 border-r border-slate-800/80">
                <div className="text-3xl font-black text-emerald-400">15% VAT</div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Reg. No. 570/2025</div>
                <div className="text-[10px] text-slate-500">Ministry of Revenues audited</div>
              </div>

              <div className="text-center space-y-1">
                <div className="text-3xl font-black text-indigo-400">9922</div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">24/7 Phone Dispatch</div>
                <div className="text-[10px] text-slate-500">Nationwide toll-free hotline</div>
              </div>
            </div>

            {/* 3 Core Value Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition">
                <div className="p-3 bg-brand-50 text-brand-700 rounded-xl w-fit">
                  <Car className="w-6 h-6" />
                </div>
                <h3 className="font-black text-base text-slate-900">Multi-Fleet Transport Aggregator</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Search your Addis Ababa route once. Compare real-time arrival estimates and metered fares across independent Chebelew drivers, licensed municipal taxi networks, and cooperative cabs without toggling multiple apps.
                </p>
                <button
                  onClick={() => navigateTo('passengers')}
                  className="text-brand-600 hover:text-brand-700 font-bold text-xs flex items-center gap-1 pt-1"
                >
                  Explore passenger features <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition">
                <div className="p-3 bg-amber-50 text-amber-700 rounded-xl w-fit">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-black text-base text-slate-900">0% Commission Driver Subscriptions</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Zero commission on trips. Drivers pay transparent daily (50 ETB), weekly (300 ETB), or monthly (1,000 ETB) subscription passes and retain 100% of their net metered earnings with instant Telebirr wallet cashouts.
                </p>
                <button
                  onClick={() => navigateTo('subscriptions')}
                  className="text-brand-600 hover:text-brand-700 font-bold text-xs flex items-center gap-1 pt-1"
                >
                  View subscription passes <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition">
                <div className="p-3 bg-purple-50 text-purple-700 rounded-xl w-fit">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="font-black text-base text-slate-900">Dual-OTP Express Logistics</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Deliver legal documents, embassy visa papers, parcel goods, and e-commerce orders across Addis Ababa with 4-digit pickup and dropoff OTP verification and cryptographic proof-of-delivery receipts.
                </p>
                <button
                  onClick={() => navigateTo('delivery')}
                  className="text-brand-600 hover:text-brand-700 font-bold text-xs flex items-center gap-1 pt-1"
                >
                  Discover express delivery <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ======================================================== */}
            {/* 3. COMPREHENSIVE ECOSYSTEM DIRECTORY GRID */}
            {/* ======================================================== */}
            <div className="space-y-6 pt-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-xl font-black text-slate-950 tracking-tight">
                  Explore the Chebelew ቼበለው Mobility Ecosystem
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official portals, technical documentation, driver subscription agreements, and regulatory frameworks.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category 1: Consumer Mobility */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-wider">
                    <Smartphone className="w-4 h-4" />
                    <span>Consumer Mobility</span>
                  </div>
                  <ul className="space-y-2 text-xs">
                    <li>
                      <button onClick={() => navigateTo('passengers')} className="text-slate-700 hover:text-brand-600 font-bold text-left block">
                        • Passenger App & Booking
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateTo('how_it_works')} className="text-slate-700 hover:text-brand-600 font-bold text-left block">
                        • How Chebelew Works
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateTo('safety')} className="text-slate-700 hover:text-brand-600 font-bold text-left block">
                        • Safety & Emergency SOS (991)
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateTo('cancellation')} className="text-slate-700 hover:text-brand-600 font-bold text-left block">
                        • Cancellation & Refund Rules
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Category 2: Driver Economics */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 font-black text-xs uppercase tracking-wider">
                    <Car className="w-4 h-4" />
                    <span>Driver Economics</span>
                  </div>
                  <ul className="space-y-2 text-xs">
                    <li>
                      <button onClick={() => navigateTo('drivers')} className="text-slate-700 hover:text-brand-600 font-bold text-left block">
                        • 0% Commission Platform
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateTo('subscriptions')} className="text-slate-700 hover:text-brand-600 font-bold text-left block">
                        • Daily, Weekly & Monthly Passes
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateTo('driver_agreement')} className="text-slate-700 hover:text-brand-600 font-bold text-left block">
                        • Driver Subscription Agreement
                      </button>
                    </li>
                    <li>
                      <button onClick={() => onNavigateToApp('driver')} className="text-brand-600 hover:text-brand-700 font-bold text-left block">
                        • Launch Driver Console ➔
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Category 3: Enterprise & Logistics */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-purple-700 font-black text-xs uppercase tracking-wider">
                    <Briefcase className="w-4 h-4" />
                    <span>Enterprise & Logistics</span>
                  </div>
                  <ul className="space-y-2 text-xs">
                    <li>
                      <button onClick={() => navigateTo('corporate')} className="text-slate-700 hover:text-brand-600 font-bold text-left block">
                        • Corporate Travel Accounts
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateTo('delivery')} className="text-slate-700 hover:text-brand-600 font-bold text-left block">
                        • Express Dual-OTP Logistics
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateTo('fleets')} className="text-slate-700 hover:text-brand-600 font-bold text-left block">
                        • Fleets & Taxi Cooperatives
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateTo('partner_agreement')} className="text-slate-700 hover:text-brand-600 font-bold text-left block">
                        • Commercial Partner Agreement
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Category 4: Platform & Legal Trust */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-amber-700 font-black text-xs uppercase tracking-wider">
                    <Shield className="w-4 h-4" />
                    <span>Governance & Trust</span>
                  </div>
                  <ul className="space-y-2 text-xs">
                    <li>
                      <button onClick={() => navigateTo('privacy')} className="text-slate-700 hover:text-brand-600 font-bold text-left block">
                        • Privacy Policy & Telebirr
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateTo('terms')} className="text-slate-700 hover:text-brand-600 font-bold text-left block">
                        • Terms of Service
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateTo('developers')} className="text-slate-700 hover:text-brand-600 font-bold text-left block">
                        • OpenAPI 3.0 & Webhooks
                      </button>
                    </li>
                    <li>
                      <button onClick={() => navigateTo('contact')} className="text-slate-700 hover:text-brand-600 font-bold text-left block">
                        • Contact Support (9922)
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Official Ethiopian Regulatory Accreditations Banner */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block text-center">
                Accredited Federal & Municipal Regulatory Frameworks
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-extrabold text-xs text-slate-900 block">Ethio Telecom</span>
                  <span className="text-[10px] text-slate-500 font-medium">Telebirr SuperApp Partner</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-extrabold text-xs text-slate-900 block">Ministry of Revenues</span>
                  <span className="text-[10px] text-slate-500 font-medium">15% VAT Reg. No. 570/2025</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-extrabold text-xs text-slate-900 block">Transport Bureau</span>
                  <span className="text-[10px] text-slate-500 font-medium">Addis Ababa City Admin</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-extrabold text-xs text-slate-900 block">Federal Police 991</span>
                  <span className="text-[10px] text-slate-500 font-medium">Direct In-App SOS Dispatch</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 2: ABOUT CHEBELEW ቼበለው */}
        {/* ======================================================== */}
        {currentPage === 'about' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <span className="text-brand-600 font-mono text-[10px] font-black uppercase tracking-wider">
                Our Heritage & Mission
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                About Chebelew (ቼበለው)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Transforming Ethiopian Urban Mobility through Open Aggregation, 0% Commission Fair Economics, and Inclusivity.
              </p>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                Founded in Addis Ababa, Ethiopia, Chebelew ቼበለው is engineered to transform African urban transportation into an open, efficient, and equitable Mobility-as-a-Service (MaaS) ecosystem. In a metropolitan landscape with fragmented taxi networks and independent drivers, passengers historically faced inconsistent availability, while drivers struggled under onerous 15% to 25% per-trip commissions.
              </p>

              <div className="grid md:grid-cols-2 gap-4 my-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-black text-slate-900 text-sm">Open Multi-Fleet Aggregation</h4>
                  </div>
                  <p className="text-slate-600">
                    Passengers search once and view verified arrival times and fares across Chebelew's direct independent fleet, licensed metered taxi networks, and cooperative municipal cabs simultaneously.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-600" />
                    <h4 className="font-black text-slate-900 text-sm">Founder Mandate 0% Commission</h4>
                  </div>
                  <p className="text-slate-600">
                    Chebelew replaces commission deductions with affordable daily, weekly, or monthly subscription passes. Drivers keep 100% of their net metered earnings with instant Telebirr cashouts.
                  </p>
                </div>
              </div>

              <h3 className="text-sm font-black text-slate-900 pt-2">Full Statutory Regulatory Compliance</h3>
              <p>
                Chebelew operates in strict accordance with the Federal Democratic Republic of Ethiopia Ministry of Revenues Value Added Tax Regulation No. 570/2025, calculating and remitting the mandatory 15% VAT on platform mobility transactions while providing passengers and corporate clients with automated, auditable electronic tax receipts.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 17: PRIVACY POLICY */}
        {/* ======================================================== */}
        {currentPage === 'privacy' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <span className="text-brand-600 font-mono text-[10px] font-black uppercase tracking-wider">
                Legal & Compliance • Proclamation No. 1205/2020 Compliant
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Privacy Policy
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Effective Date: November 14, 2026. Chebelew Technologies Ethiopia PLC.
              </p>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                Chebelew Technologies Ethiopia PLC ("Chebelew", "we", "our") is dedicated to protecting the privacy, identity, and personal data of our passengers, drivers, couriers, and enterprise partners across the Federal Democratic Republic of Ethiopia.
              </p>

              <h4 className="font-black text-sm text-slate-900 pt-2">1. Scope and Collection of Personal Data</h4>
              <p>
                We collect personal information necessary to deliver safe, transparent transportation and logistics services:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Identity & Account Details:</strong> Name, phone number (+251), preferred language (Amharic, English, Afaan Oromoo, Tigrinya, Somali), and corporate department associations.</li>
                <li><strong>Geolocation & Telemetry:</strong> Precise GPS coordinates during active trip bookings, pickup routing, and in-transit deliveries. Driver location is collected strictly while the driver is toggled Online.</li>
                <li><strong>Financial & Payment Records:</strong> Telebirr order identifiers, transaction reference numbers, and cash settlement receipts. Chebelew never stores passenger banking passwords or Telebirr PINs.</li>
                <li><strong>AI Vision KYC Hallmarks:</strong> High-resolution document scans of driver's licenses, vehicle libre, and facial biometrics verified under encrypted INSA standards.</li>
              </ul>

              <h4 className="font-black text-sm text-slate-900 pt-2">2. Processing Lawfulness and Usage</h4>
              <p>
                All personal data is processed strictly for:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Real-time matching of passengers to closest available drivers within a 5km radius.</li>
                <li>Computation of road distances, duration, and statutory 15% VAT per Regulation No. 570/2025.</li>
                <li>Dispatching live coordinates to the Ethiopian Federal Police (991) upon an SOS emergency trigger.</li>
                <li>Generating verifiable dual-OTP codes for express deliveries to prevent fraud.</li>
              </ul>

              <h4 className="font-black text-sm text-slate-900 pt-2">3. Zero Third-Party Selling Policy</h4>
              <p>
                Chebelew covenants that it shall never sell, monetize, or lease user personal data, contact directories, or location telemetry to commercial third-party advertisers. Data is shared with government authorities solely upon official lawful warrant or active emergency incident.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 18: TERMS OF SERVICE */}
        {/* ======================================================== */}
        {currentPage === 'terms' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <span className="text-brand-600 font-mono text-[10px] font-black uppercase tracking-wider">
                User Master Agreement
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Terms of Service
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Addis Ababa City Administration & Ethiopian Commercial Code Jurisdiction.
              </p>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <h4 className="font-black text-sm text-slate-900">1. Contractual Relationship</h4>
              <p>
                These Terms of Service govern the access and use by individuals located in Ethiopia of applications, dispatch hotlines (9922), websites, and content provided by Chebelew Technologies Ethiopia PLC.
              </p>

              <h4 className="font-black text-sm text-slate-900">2. Passenger Code of Conduct</h4>
              <p>
                Passengers agree to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Accurately specify pickup and dropoff points in Addis Ababa or surrounding Oromia special zones.</li>
                <li>Refrain from carrying flammable, explosive, or illicit contraband under Ethiopian criminal law.</li>
                <li>Settle the metered trip fare promptly upon arrival via Telebirr mobile money or cash.</li>
                <li>Treat drivers with dignity, avoiding any verbal abuse, vehicle property damage, or discrimination.</li>
              </ul>

              <h4 className="font-black text-sm text-slate-900">3. Driver Platform Undertakings</h4>
              <p>
                Drivers operating on the platform agree to hold a valid Ethiopian Commercial Driving License, maintain active vehicle third-party insurance, comply with maximum working hour safety regulations, and adhere strictly to the metered platform tariff.
              </p>

              <h4 className="font-black text-sm text-slate-900">4. Dispute Resolution & Governing Law</h4>
              <p>
                These Terms are governed by and construed in accordance with the laws of the Federal Democratic Republic of Ethiopia. Any dispute arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in Addis Ababa.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 19: DRIVER AGREEMENT */}
        {/* ======================================================== */}
        {currentPage === 'driver_agreement' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <span className="text-brand-600 font-mono text-[10px] font-black uppercase tracking-wider">
                Independent Subscribed Transportation Partner Contract
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Driver Subscription Agreement
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Covenant of 0% Commission and Guaranteed 100% Net Earnings Retention.
              </p>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 font-bold space-y-1">
                <div className="text-sm font-black flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>The Chebelew 0% Per-Trip Commission Guarantee</span>
                </div>
                <p className="text-[11px] font-normal leading-relaxed text-emerald-900">
                  Chebelew legally covenants that it shall NEVER deduct a percentage commission from trip fares earned by an independent subscribed driver. 100% of the metered gross fare belongs directly to the driver.
                </p>
              </div>

              <h4 className="font-black text-sm text-slate-900">Clause 1: Independent Contractor Status</h4>
              <p>
                The Driver acknowledges that they are an independent transport operator running their own mobility business. Nothing in this Agreement creates an employment, partnership, or joint venture relationship between the Driver and Chebelew.
              </p>

              <h4 className="font-black text-sm text-slate-900">Clause 2: Subscription Entitlements & Grace Period</h4>
              <p>
                Access to the Chebelew passenger dispatch network is granted through periodic subscription passes (Daily 50 ETB, Weekly 300 ETB, Monthly 1,000 ETB). Upon pass expiration, drivers receive a 24-hour grace period during which active rides and emergency support remain uninterrupted.
              </p>

              <h4 className="font-black text-sm text-slate-900">Clause 3: Instant Telebirr Payouts</h4>
              <p>
                Fares paid digitally by passengers via Telebirr are credited instantly to the Driver’s Chebelew wallet and can be withdrawn 24/7 directly to the driver’s personal Telebirr phone number with 0% withdrawal processing fee.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 20: PARTNER AGREEMENT */}
        {/* ======================================================== */}
        {currentPage === 'partner_agreement' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <span className="text-brand-600 font-mono text-[10px] font-black uppercase tracking-wider">
                Fleet & Cooperatives Master Service Agreement
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Commercial Partner Agreement
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Standard Terms for Licensed Meter Taxi Networks and Municipal Cooperatives.
              </p>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                This Commercial Partner Agreement governs the mutual dispatching, technical adapter integration, and fare reconciliation between Chebelew Technologies Ethiopia PLC and authorized fleet operators in Ethiopia.
              </p>

              <h4 className="font-black text-sm text-slate-900">1. Service Level & API Availability</h4>
              <p>
                Chebelew guarantees an adapter bridge uptime of 99.5% excluding pre-notified scheduled maintenance. If a partner API latency exceeds configured thresholds (e.g., 3,000ms), circuit breaker failover rules protect customer booking experiences.
              </p>

              <h4 className="font-black text-sm text-slate-900">2. Fare Clearing & Weekly Telebirr Settlement</h4>
              <p>
                All aggregated trip commissions, corporate account billing credits, and passenger dispatch fees are reconciled on a weekly cycle and settled electronically via Telebirr or direct national bank wire within 3 business days.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 21: SAFETY & SOS 991 */}
        {/* ======================================================== */}
        {currentPage === 'safety' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <span className="text-rose-600 font-mono text-[10px] font-black uppercase tracking-wider">
                24/7 Emergency Dispatch Center
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Safety & Emergency Response Protocol
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Passenger Protection, Real-Time Police Escalation, and Driver Security.
              </p>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950 space-y-3">
              <div className="font-black flex items-center gap-2 text-sm text-rose-900">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Ethiopian National Emergency Numbers</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-mono font-bold text-xs pt-1">
                <div className="bg-white p-2.5 rounded-lg border border-rose-200">
                  <span className="text-slate-400 block text-[9px]">Federal Police</span>
                  <span className="text-rose-700 text-sm">991</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-rose-200">
                  <span className="text-slate-400 block text-[9px]">Red Cross Ambulance</span>
                  <span className="text-slate-900 text-sm">907</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-rose-200">
                  <span className="text-slate-400 block text-[9px]">Fire & Rescue</span>
                  <span className="text-slate-900 text-sm">939</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <h4 className="font-black text-sm text-slate-900">The Chebelew In-App SOS Protocol</h4>
              <p>When a passenger or driver taps the emergency SOS button during an active trip:</p>
              <ol className="list-decimal pl-5 space-y-1.5 font-medium">
                <li>Vehicle GPS coordinates are locked at high frequency and transmitted to the 24/7 Chebelew Safety Center.</li>
                <li>The closest Ethiopian Police Sector command is alerted with vehicle plate, driver photo, and passenger contacts.</li>
                <li>The trip record is flagged with an active critical incident requiring supervisor review and resolution notes.</li>
              </ol>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 22: CANCELLATION & REFUNDS */}
        {/* ======================================================== */}
        {currentPage === 'cancellation' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <span className="text-brand-600 font-mono text-[10px] font-black uppercase tracking-wider">
                Fair Consumer & Driver Policy
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Cancellation & Refund Policy
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Balanced, transparent cancellation rules and automated Telebirr escrow refunds.
              </p>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <h4 className="font-black text-slate-900 text-xs">1. Free Cancellation Window (2 Minutes)</h4>
                <p>
                  Passengers may cancel any trip request free of charge within <strong>2 minutes</strong> of driver assignment with zero penalty.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <h4 className="font-black text-slate-900 text-xs">2. Late Cancellation Fee (50 ETB)</h4>
                <p>
                  If a passenger cancels after 2 minutes or after the driver has arrived at the pickup location, a standard cancellation fee of <strong>50 ETB</strong> is applied. 100% of this fee is credited directly to the driver to compensate for fuel expenditure and travel time.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <h4 className="font-black text-slate-900 text-xs">3. Driver Wait Time & No-Show</h4>
                <p>
                  Drivers must wait at least 5 minutes at the designated pickup address. If a passenger fails to board after 5 minutes and repeated phone calls, the driver may cancel as a passenger no-show without impacting their acceptance rating.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 4: PASSENGERS */}
        {/* ======================================================== */}
        {currentPage === 'passengers' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Passengers & Riders</h2>
              <p className="text-xs text-slate-500 mt-1">Reliable, affordable, and safe transportation across Addis Ababa.</p>
            </div>
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                Chebelew provides riders in Addis Ababa with instant access to thousands of verified vehicles. Experience transparent metered pricing, multi-fleet comparison, and seamless Telebirr payments.
              </p>
              <div className="grid md:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="block text-slate-900 text-xs">Sedan (Economy)</strong>
                  <span className="text-[11px] text-slate-500">4-passenger standard city rides</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="block text-slate-900 text-xs">Minivan (XL)</strong>
                  <span className="text-[11px] text-slate-500">7-seater for families and airport luggage</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="block text-slate-900 text-xs">Comfort (VIP)</strong>
                  <span className="text-[11px] text-slate-500">Executive sedans for business travel</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 5: DRIVERS */}
        {/* ======================================================== */}
        {currentPage === 'drivers' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Drivers (0% Commission)</h2>
              <p className="text-xs text-slate-500 mt-1">Own your business. Keep 100% of your earnings.</p>
            </div>
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                Say goodbye to giving up 15% to 25% of your hard-earned money on every trip. With Chebelew, you pay an affordable fixed subscription and keep all the money you make.
              </p>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 font-bold text-emerald-900">
                Take home up to 15,000 ETB more every month compared to commission-based platforms.
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 6: SUBSCRIPTIONS */}
        {/* ======================================================== */}
        {currentPage === 'subscriptions' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Driver Subscription Plans</h2>
              <p className="text-xs text-slate-500 mt-1">Affordable, predictable plans for full-time and part-time drivers.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-xs">
              <div className="p-5 rounded-2xl border-2 border-slate-200 space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-400">Daily Pass</span>
                <div className="text-2xl font-black text-slate-900">50 ETB <span className="text-xs font-normal">/ 24 hrs</span></div>
                <p className="text-slate-500">Perfect for weekend or flexible part-time driving.</p>
              </div>
              <div className="p-5 rounded-2xl border-2 border-brand-500 bg-brand-50/30 space-y-3">
                <span className="text-[10px] font-black uppercase text-brand-600">Weekly Flex</span>
                <div className="text-2xl font-black text-slate-900">300 ETB <span className="text-xs font-normal">/ 7 days</span></div>
                <p className="text-slate-500">Most popular for full-time metropolitan drivers.</p>
              </div>
              <div className="p-5 rounded-2xl border-2 border-slate-200 space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-400">Monthly Pro</span>
                <div className="text-2xl font-black text-slate-900">1,000 ETB <span className="text-xs font-normal">/ 30 days</span></div>
                <p className="text-slate-500">Best value with airport queue priority and corporate dispatches.</p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 7: FLEETS */}
        {/* ======================================================== */}
        {currentPage === 'fleets' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Fleets & Taxi Cooperatives</h2>
              <p className="text-xs text-slate-500 mt-1">Enterprise management tools for fleet owners and taxi associations.</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Empower your cooperative with multi-vehicle telemetry, centralized Telebirr payout disbursements, and automated vehicle inspection scheduling.
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 8: CORPORATE */}
        {/* ======================================================== */}
        {currentPage === 'corporate' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Corporate Mobility Accounts</h2>
              <p className="text-xs text-slate-500 mt-1">Seamless business travel management with monthly consolidated billing.</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Over 50+ Ethiopian enterprises, embassies, and NGOs use Chebelew Corporate to manage employee ride allowances, midnight safety escorts, and 15% VAT deductible receipts.
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 9: DELIVERY */}
        {/* ======================================================== */}
        {currentPage === 'delivery' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Express Dual-OTP Logistics</h2>
              <p className="text-xs text-slate-500 mt-1">Zero fraud last-mile parcel and document delivery.</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every package is protected with a 4-digit pickup code and 4-digit dropoff code. The courier cannot complete delivery without recipient confirmation, guaranteeing safe delivery for high-value items.
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 10: PARTNERS */}
        {/* ======================================================== */}
        {currentPage === 'partners' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Aggregator Partner Program</h2>
              <p className="text-xs text-slate-500 mt-1">Open ecosystem integration for licensed mobility operators.</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Chebelew is designed as an open aggregator that complements licensed taxi operators, municipal taxi cooperatives, and regional metered fleets. Through standardized technical integration agreements, authorized fleet operators gain access to incremental passenger demand while riders enjoy one unified booking experience.
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 11: PROVIDERS */}
        {/* ======================================================== */}
        {currentPage === 'providers' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Provider Integration Portal</h2>
              <p className="text-xs text-slate-500 mt-1">Low-latency adapter architecture with built-in circuit breakers.</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our provider adapter architecture connects third-party fleets using standard REST and WebSocket protocols. Automated circuit breakers fail over to Chebelew's direct driver network whenever third-party latency exceeds configured limits.
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 12: DEVELOPERS */}
        {/* ======================================================== */}
        {currentPage === 'developers' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Developers & OpenAPI 3.0</h2>
              <p className="text-xs text-slate-500 mt-1">Embed Chebelew ride booking and parcel delivery into your applications.</p>
            </div>
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] space-y-2">
              <div className="text-amber-400 font-bold">GET /api/developer/openapi.json</div>
              <div className="text-slate-400">curl -s https://chebelew.trustlotto.app/api/developer/openapi.json</div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 13: BLOG */}
        {/* ======================================================== */}
        {currentPage === 'blog' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Newsroom & Insights</h2>
              <p className="text-xs text-slate-500 mt-1">Official announcements and mobility engineering updates.</p>
            </div>
            <div className="space-y-4 text-xs">
              <div className="border-b pb-3 space-y-1">
                <span className="text-[10px] text-brand-600 font-bold uppercase">Press Release</span>
                <h4 className="font-bold text-sm text-slate-900">Chebelew Launches 0% Driver Subscription Model in Addis Ababa</h4>
                <p className="text-slate-500">Transforming driver take-home earnings and pioneering fair mobility in Ethiopia.</p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 14: FAQ */}
        {/* ======================================================== */}
        {currentPage === 'faq' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Frequently Asked Questions (FAQ)</h2>
              <p className="text-xs text-slate-500 mt-1">Clear answers for riders, drivers, and business partners.</p>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                <strong className="text-slate-900">Do drivers really keep 100% of their trip fares?</strong>
                <p className="text-slate-600">Yes! Chebelew never takes a per-ride commission from subscribed drivers. Drivers pay a simple fixed subscription pass (from 50 ETB/day) and keep everything else.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                <strong className="text-slate-900">How do passenger payments work?</strong>
                <p className="text-slate-600">Passengers can pay digitally with Telebirr (via QR code or USSD push) or in cash to the driver upon arrival.</p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 15: CONTACT */}
        {/* ======================================================== */}
        {currentPage === 'contact' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Contact Chebelew (9922)</h2>
              <p className="text-xs text-slate-500 mt-1">24/7 dedicated customer support, partnership inquiries, and safety operations.</p>
            </div>

            <div className="grid md:grid-cols-12 gap-8 text-xs">
              {/* Contact Information & Hotlines */}
              <div className="md:col-span-5 space-y-5">
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-brand-600" />
                    Central Operations Hotline
                  </h4>
                  <p className="text-slate-600">
                    Dial <strong>9922</strong> toll-free from any Ethio Telecom or Safaricom mobile line in Ethiopia.
                  </p>
                  <div className="pt-2 border-t border-slate-200 space-y-2 text-slate-700">
                    <div><strong>Headquarters:</strong> Bole Medhanialem Mall, 4th Floor, Addis Ababa, Ethiopia</div>
                    <div><strong>Support Email:</strong> support@chebelew.et</div>
                    <div><strong>Corporate Inquiries:</strong> enterprise@chebelew.et</div>
                    <div><strong>Police Emergency:</strong> 991 (Integrated with SOS Console)</div>
                  </div>
                </div>

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                  <strong className="block font-bold">Fast In-App Resolution</strong>
                  <p>Existing passengers and drivers can report lost items or fare disputes directly from their trip history for instant GPS route auditing.</p>
                </div>
              </div>

              {/* Live Interactive Support Ticket Form */}
              <div className="md:col-span-7">
                {contactSubmitted ? (
                  <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                    <h3 className="font-bold text-base text-emerald-900">Message Received!</h3>
                    <p className="text-xs text-emerald-700 max-w-md mx-auto">
                      Thank you for contacting Chebelew. Your inquiry has been routed to our Central Dispatch & Support Team.
                      {ticketIdCreated && (
                        <span className="block mt-2 font-mono font-bold bg-white/80 py-1 px-2 rounded border border-emerald-300">
                          Tracking Ticket: #{ticketIdCreated}
                        </span>
                      )}
                    </p>
                    <button
                      onClick={() => {
                        setContactSubmitted(false);
                        setTicketIdCreated(null);
                        setContactForm({ name: '', phone: '', email: '', subject: 'General Inquiry', message: '' });
                      }}
                      className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h4 className="font-bold text-sm text-slate-800">Send an Inquiry or Support Request</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Your Full Name</label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="e.g. Abebe Bikila"
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Mobile Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          placeholder="+251 9..."
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                        <input
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="your.email@example.com"
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Inquiry Subject</label>
                        <select
                          value={contactForm.subject}
                          onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option value="General Inquiry">General Inquiry</option>
                          <option value="Driver Onboarding (0% Comm)">Driver Onboarding (0% Comm)</option>
                          <option value="Fleet / Cooperative Partnership">Fleet / Cooperative Partnership</option>
                          <option value="Corporate Business Account">Corporate Business Account</option>
                          <option value="Fare Meter Dispute">Fare Meter Dispute</option>
                          <option value="Lost & Found Report">Lost & Found Report</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Message / Details</label>
                      <textarea
                        required
                        rows={4}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="Please describe your question, vehicle fleet size, or issue..."
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingContact}
                      className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50"
                    >
                      {isSubmittingContact ? 'Submitting to Dispatch Queue...' : 'Submit Inquiry (Ticket Created)'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 16: HELP */}
        {/* ======================================================== */}
        {currentPage === 'help' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">24/7 Help Center</h2>
              <p className="text-xs text-slate-500 mt-1">Resolution guides for travel, payments, and account inquiries.</p>
            </div>
            <p className="text-xs text-slate-600">
              For lost items, fare disputes, or driver behavior reports, dial 9922 for immediate assistance.
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 3: HOW IT WORKS */}
        {/* ======================================================== */}
        {currentPage === 'how_it_works' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">How Chebelew Works</h2>
              <p className="text-xs text-slate-500 mt-1">Simple 4-step urban mobility workflow.</p>
            </div>
            <div className="grid md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                <span className="font-black text-brand-600 text-sm">1. Enter Destination</span>
                <p className="text-slate-600">Select any landmark in Addis Ababa (Bole, Piassa, Kazanchis, Mexico).</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                <span className="font-black text-brand-600 text-sm">2. Compare Fares</span>
                <p className="text-slate-600">View real-time estimates across fleets and pick the best option.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                <span className="font-black text-brand-600 text-sm">3. Ride in Safety</span>
                <p className="text-slate-600">Track your verified driver on the live map with SOS 991 backup.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                <span className="font-black text-brand-600 text-sm">4. Telebirr or Cash</span>
                <p className="text-slate-600">Pay automatically via Telebirr or cash with instant VAT receipts.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* 4. PROFESSIONAL MULTI-COLUMN SITE DIRECTORY FOOTER */}
      {/* ======================================================== */}
      <footer className="bg-slate-950 text-white border-t border-slate-800 pt-12 pb-8 text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Col 1: Brand Info */}
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <img src="/chebelew-logo.svg" alt="Chebelew Logo" className="w-8 h-8" />
                <span className="font-black text-base text-white">Chebelew ቼበለው</span>
              </div>
              <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                Ethiopia's premier ride-hailing aggregator and 0% commission driver subscription platform. Certified under FDRE Ministry of Revenues VAT Regulation No. 570/2025.
              </p>
              <div className="text-slate-500 text-[11px]">
                Headquarters: Bole Medhanialem Mall, Addis Ababa, Ethiopia
              </div>
            </div>

            {/* Col 2: Products */}
            <div className="space-y-2.5">
              <h4 className="font-black text-xs text-white uppercase tracking-wider">Products</h4>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li><button onClick={() => navigateTo('passengers')} className="hover:text-white">Passengers</button></li>
                <li><button onClick={() => navigateTo('drivers')} className="hover:text-white">Drivers (0% Comm)</button></li>
                <li><button onClick={() => navigateTo('subscriptions')} className="hover:text-white">Subscription Passes</button></li>
                <li><button onClick={() => navigateTo('delivery')} className="hover:text-white">Express Delivery</button></li>
                <li><button onClick={() => navigateTo('how_it_works')} className="hover:text-white">How It Works</button></li>
              </ul>
            </div>

            {/* Col 3: Business & APIs */}
            <div className="space-y-2.5">
              <h4 className="font-black text-xs text-white uppercase tracking-wider">Business</h4>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li><button onClick={() => navigateTo('corporate')} className="hover:text-white">Corporate Travel</button></li>
                <li><button onClick={() => navigateTo('fleets')} className="hover:text-white">Fleets & Cooperatives</button></li>
                <li><button onClick={() => navigateTo('partners')} className="hover:text-white">Aggregator Program</button></li>
                <li><button onClick={() => navigateTo('providers')} className="hover:text-white">Provider Adapters</button></li>
                <li><button onClick={() => navigateTo('developers')} className="hover:text-white">OpenAPI 3.0 Specs</button></li>
              </ul>
            </div>

            {/* Col 4: Trust & Legal */}
            <div className="space-y-2.5">
              <h4 className="font-black text-xs text-white uppercase tracking-wider">Governance</h4>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li><button onClick={() => navigateTo('privacy')} className="hover:text-white">Privacy Policy</button></li>
                <li><button onClick={() => navigateTo('terms')} className="hover:text-white">Terms of Service</button></li>
                <li><button onClick={() => navigateTo('driver_agreement')} className="hover:text-white">Driver Agreement</button></li>
                <li><button onClick={() => navigateTo('partner_agreement')} className="hover:text-white">Partner Agreement</button></li>
                <li><button onClick={() => navigateTo('safety')} className="hover:text-white">Safety SOS (991)</button></li>
                <li><button onClick={() => navigateTo('cancellation')} className="hover:text-white">Cancellation Policy</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <div>© 2026 Chebelew Technologies Ethiopia PLC. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <span>National Call Center: <strong>9922</strong></span>
              <span>•</span>
              <span>Federal Police Dispatch: <strong>991</strong></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
