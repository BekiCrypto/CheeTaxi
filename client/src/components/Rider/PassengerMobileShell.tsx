import React, { useState, useEffect } from 'react';
import { 
  Car, Clock, Wallet, Bookmark, User, ShieldAlert, Globe, 
  MapPin, Plus, Trash2, CheckCircle2, ChevronRight, Phone,
  Receipt, ArrowUpRight, AlertTriangle, Star, RefreshCw
} from 'lucide-react';
import { RiderView } from './RiderView';
import { Language, translations } from '../../i18n/translations';
import { MobileAuthModal } from '../Onboarding/MobileAuthModal';
import { ADDIS_LANDMARKS } from '@shared/landmarks';

interface PassengerMobileShellProps {
  currentRiderId: string;
  currentRiderName: string;
  currentRiderPhone: string;
  language: Language;
  onLanguageChange?: (lang: Language) => void;
  socket: any;
}

type MobileTab = 'ride' | 'activity' | 'wallet' | 'saved' | 'profile';

interface SavedPlace {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  iconType: 'home' | 'work' | 'airport' | 'other';
}

export const PassengerMobileShell: React.FC<PassengerMobileShellProps> = ({
  currentRiderId: initialRiderId,
  currentRiderName: initialRiderName,
  currentRiderPhone: initialRiderPhone,
  language,
  onLanguageChange,
  socket,
}) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('ride');
  const [user, setUser] = useState({
    id: initialRiderId,
    name: initialRiderName,
    phone: initialRiderPhone,
    role: 'rider',
    language,
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [tripHistory, setTripHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Saved Places State
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([
    {
      id: 'sp_home',
      label: 'Home / ቤት',
      address: 'CMC Michael, Addis Ababa',
      lat: 9.025,
      lng: 38.835,
      iconType: 'home',
    },
    {
      id: 'sp_work',
      label: 'Office / ሥራ',
      address: 'Kazanchis, ECA Conference Center',
      lat: 9.018,
      lng: 38.771,
      iconType: 'work',
    },
    {
      id: 'sp_airport',
      label: 'Bole Airport / ቦሌ አየር ማረፊያ',
      address: 'Addis Ababa Bole International Airport, Terminal 2',
      lat: 8.9778,
      lng: 38.7993,
      iconType: 'airport',
    },
  ]);

  const [newPlaceLabel, setNewPlaceLabel] = useState('');
  const [newPlaceAddress, setNewPlaceAddress] = useState('');

  // Online / Offline monitor
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load cached session if available
    try {
      const cached = localStorage.getItem('chebelew_active_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.role === 'rider') {
          setUser(parsed);
        }
      }
    } catch (e) {}

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch ride history
  const fetchRideHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/rides/history/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setTripHistory(data.rides || []);
      }
    } catch (e) {
      console.error('Failed to load ride history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchRideHistory();
    }
  }, [activeTab]);

  const handleAddSavedPlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaceLabel || !newPlaceAddress) return;

    const newPlace: SavedPlace = {
      id: `sp_${Date.now()}`,
      label: newPlaceLabel,
      address: newPlaceAddress,
      lat: 9.0105, // default Addis central coords
      lng: 38.7615,
      iconType: 'other',
    };

    setSavedPlaces([...savedPlaces, newPlace]);
    setNewPlaceLabel('');
    setNewPlaceAddress('');
  };

  const handleDeleteSavedPlace = (id: string) => {
    setSavedPlaces(savedPlaces.filter((p) => p.id !== id));
  };

  const t = translations[language] || translations.en;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Offline Status Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between z-50">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Offline Mode — Using Cached Addis Data
          </span>
          <span className="text-[10px] font-mono">RECONNECTING...</span>
        </div>
      )}

      {/* Mobile Top App Bar */}
      <header className="h-14 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 px-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center font-black text-slate-950 text-base shadow-md">
            ቼ
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-wider text-white uppercase">CHEBELEW</span>
              <span className="text-[10px] font-bold text-amber-400 font-serif">ቼበለው</span>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Addis Ababa Fleet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick SOS 991 */}
          <a
            href="tel:991"
            className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-xs font-extrabold border border-rose-500/30 flex items-center gap-1 transition"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> 991
          </a>

          {/* User Sign In / Profile Avatar */}
          <button
            onClick={() => setIsAuthOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold border border-slate-700 text-slate-200 transition"
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span className="max-w-[70px] truncate">{user.name.split(' ')[0]}</span>
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 relative overflow-hidden">
        {/* TAB 1: RIDE (Interactive Booking & Map) */}
        {activeTab === 'ride' && (
          <div className="h-full w-full">
            <RiderView
              currentRiderId={user.id}
              currentRiderName={user.name}
              currentRiderPhone={user.phone}
              language={language}
              socket={socket}
            />
          </div>
        )}

        {/* TAB 2: ACTIVITY & TRIP HISTORY */}
        {activeTab === 'activity' && (
          <div className="h-full w-full overflow-y-auto p-4 space-y-4 max-w-lg mx-auto pb-20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">Your Trips / ጉዞዎችዎ</h2>
                <p className="text-xs text-slate-400">Electronic Tax Invoices & Ride History</p>
              </div>
              <button
                onClick={fetchRideHistory}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition"
              >
                <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {tripHistory.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                <Car className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300">No Past Trips Recorded</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Your completed trips across Addis Ababa and Bole Airport will appear here with Ministry of Revenues tax receipts.
                </p>
                <button
                  onClick={() => setActiveTab('ride')}
                  className="mt-2 px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Book Your First Ride
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {tripHistory.map((trip) => (
                  <div key={trip.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        {trip.id.slice(0, 10)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        {trip.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{trip.pickup?.address || 'Pickup'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{trip.destination?.address || 'Destination'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px]">Paid: </span>
                        <strong className="text-white text-sm">{trip.fare?.totalFare || 0} ETB</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">{trip.paymentMethod}</span>
                        <button
                          onClick={() => {
                            if (trip.id) {
                              window.open(`/track/${trip.id}`, '_blank');
                            }
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg font-bold text-[11px] flex items-center gap-1"
                        >
                          <Receipt className="w-3 h-3" /> Receipt
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WALLET */}
        {activeTab === 'wallet' && (
          <div className="h-full w-full overflow-y-auto p-4 space-y-4 max-w-lg mx-auto pb-20">
            <div>
              <h2 className="text-base font-black text-white">Digital Wallet / የኪስ ቦርሳ</h2>
              <p className="text-xs text-slate-400">Telebirr, CBE Birr & International Cards</p>
            </div>

            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-3xl p-5 text-slate-950 shadow-xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-900/80">
                    Chebelew Passenger Balance
                  </p>
                  <h3 className="text-3xl font-black tracking-tight mt-1">1,250.00 <span className="text-lg">ETB</span></h3>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center font-bold text-lg">
                  ብር
                </div>
              </div>

              <div className="pt-2 border-t border-slate-900/20 flex justify-between items-center text-xs font-bold">
                <span>NBE Exchange Rate: ~124.50 ETB / USD</span>
                <span className="bg-slate-950/15 px-2 py-0.5 rounded-lg">Verified Account</span>
              </div>
            </div>

            {/* Payment Methods List */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Connected Payment Rails</h3>

              {/* Telebirr */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow">
                    TB
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Telebirr Digital Wallet</h4>
                    <p className="text-xs text-slate-400 font-mono">{user.phone}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  Active
                </span>
              </div>

              {/* Commercial Bank of Ethiopia (CBE) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-700 text-white font-black flex items-center justify-center text-sm shadow">
                    CBE
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">CBE Birr / Commercial Bank</h4>
                    <p className="text-xs text-slate-400 font-mono">1000••••••••4892</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">
                  Linked
                </span>
              </div>

              {/* International Credit/Debit Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-black flex items-center justify-center text-sm shadow">
                    VISA
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">International Card</h4>
                    <p className="text-xs text-slate-400 font-mono">•••• 8821 (Auto USD/ETB)</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">
                  NBE Rate
                </span>
              </div>
            </div>

            {/* 0% Commission Policy Guarantee */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-400 space-y-1">
              <p className="font-bold text-slate-200">Zero Commission Fare Policy:</p>
              <p>Passengers pay standard regulated fares with no platform surcharge. Independent drivers keep 100% of the trip fare via their fixed subscription.</p>
            </div>
          </div>
        )}

        {/* TAB 4: SAVED PLACES */}
        {activeTab === 'saved' && (
          <div className="h-full w-full overflow-y-auto p-4 space-y-4 max-w-lg mx-auto pb-20">
            <div>
              <h2 className="text-base font-black text-white">Saved Places / የተቀመጡ ቦታዎች</h2>
              <p className="text-xs text-slate-400">1-Tap Fast Pickup & Destination Selection</p>
            </div>

            <div className="space-y-2.5">
              {savedPlaces.map((place) => (
                <div key={place.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                      <Bookmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{place.label}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1">{place.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('ride')}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
                    >
                      Select
                    </button>
                    <button
                      onClick={() => handleDeleteSavedPlace(place.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Place Form */}
            <form onSubmit={handleAddSavedPlace} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Add Custom Location</h3>
              <div>
                <input
                  type="text"
                  placeholder="Label (e.g. Gym, Mother's Home, Church)"
                  value={newPlaceLabel}
                  onChange={(e) => setNewPlaceLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Address or landmark in Addis Ababa"
                  value={newPlaceAddress}
                  onChange={(e) => setNewPlaceAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition"
              >
                <Plus className="w-4 h-4" /> Save Place
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: PROFILE & SUPPORT */}
        {activeTab === 'profile' && (
          <div className="h-full w-full overflow-y-auto p-4 space-y-4 max-w-lg mx-auto pb-20">
            <div>
              <h2 className="text-base font-black text-white">Account & Support / መለያ እና ድጋፍ</h2>
              <p className="text-xs text-slate-400">Settings, Language and 24/7 Safety</p>
            </div>

            {/* Profile Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{user.name}</h3>
                  <p className="text-xs text-amber-400 font-mono">{user.phone}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Verified Passenger • Addis Ababa</p>
                </div>
              </div>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition"
              >
                Switch
              </button>
            </div>

            {/* Language Switcher */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Preferred Language / ቋንቋ</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { code: 'en', label: 'English' },
                  { code: 'am', label: 'አማርኛ (Amharic)' },
                  { code: 'om', label: 'Afaan Oromoo' },
                  { code: 'ti', label: 'ትግርኛ (Tigrinya)' },
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      if (onLanguageChange) onLanguageChange(l.code as Language);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      language === l.code
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 24/7 Emergency & Call Center */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ethiopian Safety & Support</h3>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:991"
                  className="p-3 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition"
                >
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <span>Federal Police (991)</span>
                </a>
                <a
                  href="tel:9922"
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition"
                >
                  <Phone className="w-5 h-5 text-amber-400" />
                  <span>Chebelew Help (9922)</span>
                </a>
              </div>
              <p className="text-[11px] text-slate-500 text-center">
                Chebelew Operations Center • Bole Sub-City, Addis Ababa, Ethiopia
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="h-16 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-2 flex items-center justify-around z-30 shrink-0">
        <button
          onClick={() => setActiveTab('ride')}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
            activeTab === 'ride' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Car className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Ride</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
            activeTab === 'activity' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Trips</span>
        </button>

        <button
          onClick={() => setActiveTab('wallet')}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
            activeTab === 'wallet' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Wallet</span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
            activeTab === 'saved' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Saved</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition ${
            activeTab === 'profile' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Account</span>
        </button>
      </nav>

      {/* Authentication Modal */}
      <MobileAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultRole="rider"
        language={language}
        onAuthenticated={(authUser) => {
          setUser(authUser);
          if (onLanguageChange && authUser.language) {
            onLanguageChange(authUser.language);
          }
        }}
      />
    </div>
  );
};
