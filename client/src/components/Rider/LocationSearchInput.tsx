import React, { useState, useRef, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  X,
  Crosshair,
  Map,
  Building2,
  Hotel,
  Plane,
  Landmark,
  Compass,
  Check,
} from 'lucide-react';
import { LocationPoint } from '@shared/types';
import { AddisLandmark, ADDIS_LANDMARKS } from '@shared/landmarks';
import { Language } from '../../i18n/translations';

interface LocationSearchInputProps {
  type: 'pickup' | 'destination';
  value: LocationPoint;
  onChange: (point: LocationPoint) => void;
  onPickOnMap: () => void;
  language: Language;
  placeholder?: string;
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  type,
  value,
  onChange,
  onPickOnMap,
  language,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isPickup = type === 'pickup';
  const displayAddress = language === 'am' && value.addressAm ? value.addressAm : value.address;

  // Filter landmarks by query
  const filteredLandmarks = ADDIS_LANDMARKS.filter((l) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      (l.nameAm && l.nameAm.includes(q)) ||
      (l.description && l.description.toLowerCase().includes(q)) ||
      l.category.toLowerCase().includes(q)
    );
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transit':
        return <Plane className="w-3.5 h-3.5 text-blue-500" />;
      case 'hotel':
        return <Hotel className="w-3.5 h-3.5 text-amber-500" />;
      case 'commercial':
        return <Building2 className="w-3.5 h-3.5 text-purple-500" />;
      case 'square':
        return <Landmark className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <Compass className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Handle GPS location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        onChange({
          address: 'Current Location (Addis Ababa)',
          addressAm: 'የአሁኑ መገኛ (አዲስ አበባ)',
          lat: latitude,
          lng: longitude,
        });
        setIsOpen(false);
      },
      () => {
        setIsLocating(false);
        // Fallback to central Addis coordinate
        onChange({
          address: 'Current Location (Bole Medhanialem)',
          addressAm: 'የአሁኑ መገኛ (ቦሌ መድኃኔዓለም)',
          lat: 8.995,
          lng: 38.788,
        });
        setIsOpen(false);
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  const handleSelectLandmark = (landmark: AddisLandmark) => {
    onChange({
      address: landmark.name,
      addressAm: landmark.nameAm,
      lat: landmark.lat,
      lng: landmark.lng,
    });
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Bar */}
      <div
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border transition cursor-pointer shadow-xs ${
          isOpen
            ? 'border-brand-500 ring-2 ring-brand-500/20 bg-white'
            : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-white'
        }`}
      >
        <div className="flex-shrink-0">
          {isPickup ? (
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <MapPin className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <Navigation className="w-3.5 h-3.5 rotate-45" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {isPickup ? (language === 'am' ? 'መነሻ ቦታ' : 'Pickup Location') : (language === 'am' ? 'መድረሻ ቦታ' : 'Destination')}
          </span>
          <div className="text-xs font-semibold text-slate-800 truncate">
            {displayAddress || placeholder || 'Select location'}
          </div>
        </div>

        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </div>

      {/* Floating Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[360px] animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Top Live Filter Input */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/80 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={language === 'am' ? 'በስም ወይም በአካባቢ ይፈልጉ...' : 'Type landmark, street or area...'}
              className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Actions (GPS & Set on Map) */}
          <div className="p-2 border-b border-slate-100 flex gap-1.5 bg-white">
            {isPickup && (
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onPickOnMap();
              }}
              className="flex-1 py-1.5 px-2 bg-brand-50 hover:bg-brand-100 text-brand-800 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Map className="w-3.5 h-3.5" />
              <span>Choose on Map</span>
            </button>
          </div>

          {/* Filtered Landmarks List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {filteredLandmarks.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching landmarks found. Try another search or use &quot;Choose on Map&quot;.
              </div>
            ) : (
              filteredLandmarks.map((landmark) => {
                const isSelected = landmark.name === value.address;
                return (
                  <button
                    key={landmark.id}
                    type="button"
                    onClick={() => handleSelectLandmark(landmark)}
                    className={`w-full text-left p-2.5 hover:bg-brand-50/60 flex items-center justify-between gap-3 transition ${
                      isSelected ? 'bg-brand-50/80 font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        {getCategoryIcon(landmark.category)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {language === 'am' ? landmark.nameAm : landmark.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {language === 'am' ? landmark.name : landmark.nameAm} • {landmark.description}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-brand-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
