import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Command,
  MapPin,
  Car,
  Wallet,
  Shield,
  Plane,
  Globe,
  Sliders,
  X,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Zap,
} from 'lucide-react';
import { LocationPoint } from '@shared/types';
import { ADDIS_LANDMARKS, AddisLandmark } from '@shared/landmarks';

export interface QuickActionItem {
  id: string;
  title: string;
  titleAm?: string;
  subtitle: string;
  category: 'DESTINATIONS' | 'ACTIONS' | 'SYSTEM';
  icon: React.ReactNode;
  badge?: string;
  onSelect: () => void;
}

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDestination?: (loc: LocationPoint) => void;
  onSelectRole?: (role: 'rider' | 'driver' | 'admin' | 'split' | 'website') => void;
  onOpenWallet?: () => void;
  onOpenSchedule?: () => void;
  onTriggerSos?: () => void;
  currentLanguage?: string;
}

export const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  isOpen,
  onClose,
  onSelectDestination,
  onSelectRole,
  onOpenWallet,
  onOpenSchedule,
  onTriggerSos,
  currentLanguage = 'en',
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAmharic = currentLanguage === 'am';

  // Base list of platform quick actions
  const actionItems: QuickActionItem[] = [
    {
      id: 'action-request-ride',
      title: isAmharic ? 'ታክሲ ጥራ' : 'Request a Ride',
      subtitle: isAmharic ? 'ወደ መንገደኛ ክፍል ሂድ' : 'Switch to Passenger Commute View',
      category: 'ACTIONS',
      icon: <Car className="w-4 h-4 text-brand-600" />,
      badge: 'Enter',
      onSelect: () => {
        if (onSelectRole) onSelectRole('rider');
        onClose();
      },
    },
    {
      id: 'action-open-wallet',
      title: isAmharic ? 'የመንገደኛ ዲጂታል ቦርሳ' : 'Open Passenger Digital Wallet',
      subtitle: isAmharic ? 'በቴሌብር ወይም በካርድ ሒሳብ ሙላ' : 'Top up balance via Telebirr, CBE, or Cards',
      category: 'ACTIONS',
      icon: <Wallet className="w-4 h-4 text-emerald-600" />,
      badge: '1-Click',
      onSelect: () => {
        if (onOpenWallet) onOpenWallet();
        onClose();
      },
    },
    {
      id: 'action-airport-schedule',
      title: isAmharic ? 'የቦሌ አውሮፕላን ማረፊያ ቀጠሮ' : 'Bole Airport Flight Transfer',
      subtitle: isAmharic ? 'የኢትዮጵያ አየር መንገድ በረራ መከታተያ' : 'Schedule transit with flight number tracking',
      category: 'ACTIONS',
      icon: <Plane className="w-4 h-4 text-blue-600" />,
      badge: 'Terminal 1/2',
      onSelect: () => {
        if (onOpenSchedule) onOpenSchedule();
        onClose();
      },
    },
    {
      id: 'action-driver-workplace',
      title: isAmharic ? 'የአሽከርካሪ የሥራ ቦታ' : 'Driver Workplace & Payout Rails',
      subtitle: isAmharic ? '0% ኮሚሽን እና የዕለት ገቢ' : 'Manage zero-commission earnings & Telebirr rail',
      category: 'ACTIONS',
      icon: <Zap className="w-4 h-4 text-amber-600" />,
      onSelect: () => {
        if (onSelectRole) onSelectRole('driver');
        onClose();
      },
    },
    {
      id: 'action-admin-console',
      title: isAmharic ? 'የቁጥጥር ማዕከል' : 'Operations Control Center',
      subtitle: isAmharic ? 'የአስተዳዳሪ እና የታክሲ ቁጥጥር' : 'Access Fleet, Dispatch, VAT & Tariffs',
      category: 'SYSTEM',
      icon: <Shield className="w-4 h-4 text-purple-600" />,
      badge: 'Admin',
      onSelect: () => {
        if (onSelectRole) onSelectRole('admin');
        onClose();
      },
    },
    {
      id: 'action-emergency-sos',
      title: isAmharic ? 'የአደጋ ጊዜ ፖሊስ 991' : 'Emergency Police SOS (991)',
      subtitle: isAmharic ? 'የአደጋ ጊዜ ጥሪ እና የጂፒኤስ ማጋራት' : 'Instant emergency dispatch with live coordinates',
      category: 'SYSTEM',
      icon: <PhoneCall className="w-4 h-4 text-rose-600" />,
      badge: 'SOS',
      onSelect: () => {
        if (onTriggerSos) onTriggerSos();
        onClose();
      },
    },
  ];

  // Landmarks mapped to quick search items
  const landmarkItems: QuickActionItem[] = (ADDIS_LANDMARKS as AddisLandmark[]).slice(0, 10).map((lm: AddisLandmark) => ({
    id: `landmark-${lm.id}`,
    title: isAmharic ? lm.nameAm : lm.name,
    subtitle: `${lm.description} • Addis Ababa`,
    category: 'DESTINATIONS',
    icon: <MapPin className="w-4 h-4 text-brand-500" />,
    badge: lm.category,
    onSelect: () => {
      if (onSelectDestination) {
        onSelectDestination({
          address: `${lm.name}, Addis Ababa`,
          lat: lm.lat,
          lng: lm.lng,
        });
      }
      onClose();
    },
  }));

  const allItems = [...actionItems, ...landmarkItems];

  const filteredItems = query.trim() === ''
    ? allItems
    : allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      );

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Keyboard Navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filteredItems.length || 1)) % (filteredItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].onSelect();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-xl frosted-glass rounded-2xl shadow-2xl border border-white/60 overflow-hidden flex flex-col max-h-[82vh] transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-200/60 bg-white/60">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={
              isAmharic
                ? 'ቦታዎችን፣ አውሮፕላን ማረፊያ፣ ወይም እርምጃዎችን ፈልግ...'
                : 'Search places, airport transit, or quick actions...'
            }
            className="w-full pl-8 pr-16 bg-transparent text-slate-900 placeholder-slate-400 font-medium text-sm focus:outline-none"
          />
          <div className="absolute right-3 flex items-center gap-1.5">
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-slate-100 rounded border border-slate-200">
              ESC
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 flex-1 divide-y divide-slate-100/60">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-500 text-xs">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No matching destinations or actions found</p>
              <p className="text-[11px] text-slate-400 mt-1">Try searching "Bole", "Wallet", "Driver", or "Airport"</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.onSelect()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-brand-500 text-white shadow-xs'
                      : 'hover:bg-white/80 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">{item.title}</span>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-mono uppercase font-black px-1.5 py-0.5 rounded ${
                              isSelected
                                ? 'bg-white/25 text-white'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] block line-clamp-1 ${
                          isSelected ? 'text-white/80' : 'text-slate-500'
                        }`}
                      >
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 transition ${
                      isSelected ? 'text-white translate-x-0.5' : 'text-slate-300 opacity-0 group-hover:opacity-100'
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2 border-t border-slate-200/60 bg-slate-50/60 text-[10px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-white border border-slate-200 rounded font-mono font-bold">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-white border border-slate-200 rounded font-mono font-bold">↵</kbd> Select
            </span>
          </div>
          <span className="font-semibold text-brand-600 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Chebelew Quick Spotlight
          </span>
        </div>
      </div>
    </div>
  );
};