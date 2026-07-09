'use client';

import { useEffect, useState } from 'react';

interface DriverPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'ONLINE' | 'ON_TRIP' | 'OFFLINE';
  vehicle: string;
}

interface ActiveTrip {
  id: string;
  passenger: string;
  driver?: string;
  pickup: string;
  dropoff: string;
  status: string;
  fare: number;
  requestedAgo: string;
}

// Sample data — in production, fetched from /drivers/nearby + WebSocket
const SAMPLE_DRIVERS: DriverPin[] = [
  { id: 'd1', name: 'Abebe T.', lat: 9.0084, lng: 38.7625, status: 'ON_TRIP', vehicle: 'Toyota Corolla' },
  { id: 'd2', name: 'Sara M.', lat: 9.0150, lng: 38.7700, status: 'ONLINE', vehicle: 'Suzuki Dzire' },
  { id: 'd3', name: 'Yonas G.', lat: 9.0200, lng: 38.7800, status: 'ONLINE', vehicle: 'Honda motorcycle' },
  { id: 'd4', name: 'Helen K.', lat: 8.9980, lng: 38.7550, status: 'ON_TRIP', vehicle: 'Bajaj three-wheeler' },
  { id: 'd5', name: 'Daniel A.', lat: 9.0250, lng: 38.7850, status: 'ONLINE', vehicle: 'Hyundai i10' },
];

const SAMPLE_TRIPS: ActiveTrip[] = [
  { id: 'TR-8421', passenger: 'Kidist B.', driver: 'Abebe T.', pickup: 'Bole Medhanealem', dropoff: 'Piazza', status: 'IN_PROGRESS', fare: 145, requestedAgo: '12m ago' },
  { id: 'TR-8420', passenger: 'Mulu G.', driver: 'Helen K.', pickup: 'Merkato', dropoff: 'CMC', status: 'IN_PROGRESS', fare: 230, requestedAgo: '8m ago' },
  { id: 'TR-8419', passenger: 'Samuel T.', pickup: 'Megenagna', dropoff: 'Bole Airport', status: 'SEARCHING', fare: 180, requestedAgo: 'just now' },
  { id: 'TR-8418', passenger: 'Bethel N.', pickup: 'Sarbet', dropoff: '4 Kilo', status: 'SEARCHING', fare: 95, requestedAgo: '30s ago' },
];

export default function DispatcherConsole() {
  const [drivers] = useState<DriverPin[]>(SAMPLE_DRIVERS);
  const [trips, setTrips] = useState<ActiveTrip[]>(SAMPLE_TRIPS);
  const [selectedTrip, setSelectedTrip] = useState<ActiveTrip | null>(null);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Project lat/lng to SVG coordinates (simplified — Addis Ababa bounds)
  function project(lat: number, lng: number) {
    const minLat = 8.98, maxLat = 9.04, minLng = 38.74, maxLng = 38.80;
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return { x, y };
  }

  const onlineCount = drivers.filter((d) => d.status !== 'OFFLINE').length;
  const onTripCount = drivers.filter((d) => d.status === 'ON_TRIP').length;
  const searchingCount = trips.filter((t) => t.status === 'SEARCHING').length;

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <header className="flex h-14 flex-none items-center justify-between border-b border-ink-700 bg-ink-800 px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-brand-500 text-sm font-bold text-white">C</div>
          <span className="font-bold text-white">CheeTaxi Dispatcher</span>
          <span className="ml-3 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
            ● Live
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="text-ink-300">
            <span className="text-2xl font-bold text-emerald-400">{onlineCount}</span> online
          </div>
          <div className="text-ink-300">
            <span className="text-2xl font-bold text-brand-400">{onTripCount}</span> on trip
          </div>
          <div className="text-ink-300">
            <span className="text-2xl font-bold text-amber-400">{searchingCount}</span> searching
          </div>
          <div className="font-mono text-ink-300">{now.toLocaleTimeString()}</div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="relative flex-1 bg-ink-900">
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
            {/* Grid */}
            <defs>
              <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#1B1E22" strokeWidth="0.2" />
              </pattern>
              <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F08C00" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#F08C00" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />

            {/* Fake roads */}
            <path d="M 0 50 L 100 50" stroke="#2A2E34" strokeWidth="1.5" />
            <path d="M 50 0 L 50 100" stroke="#2A2E34" strokeWidth="1.5" />
            <path d="M 0 30 Q 30 40 60 35 T 100 45" stroke="#2A2E34" strokeWidth="0.8" fill="none" />
            <path d="M 20 0 L 80 100" stroke="#2A2E34" strokeWidth="0.6" fill="none" />

            {/* Driver pins */}
            {drivers.map((d) => {
              const p = project(d.lat, d.lng);
              const color = d.status === 'ON_TRIP' ? '#F08C00' : d.status === 'ONLINE' ? '#10B981' : '#7F8590';
              return (
                <g key={d.id} transform={`translate(${p.x} ${p.y})`}>
                  <circle r="4" fill="url(#glow)" />
                  <circle r="1.8" fill={color} stroke="#0E1012" strokeWidth="0.4" />
                  <text x="2.5" y="0.5" fill="#B0B5BC" fontSize="2">{d.name}</text>
                </g>
              );
            })}
          </svg>

          <div className="absolute bottom-4 left-4 card p-3 text-xs">
            <div className="mb-2 font-bold text-ink-100">Addis Ababa</div>
            <div className="flex gap-3">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Online</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-brand-500" /> On trip</span>
            </div>
          </div>
        </div>

        {/* Trip queue */}
        <aside className="w-96 flex-none overflow-y-auto border-l border-ink-700 bg-ink-800">
          <div className="p-4">
            <h2 className="text-lg font-bold text-white">Active queue</h2>
            <p className="text-xs text-ink-400">{trips.length} trips in progress</p>
          </div>
          <div className="space-y-2 px-4 pb-4">
            {trips.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTrip(t)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  selectedTrip?.id === t.id
                    ? 'border-brand-400 bg-brand-500/10'
                    : 'border-ink-700 bg-ink-900 hover:border-ink-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-bold text-brand-400">{t.id}</div>
                  <span className={`badge ${t.status === 'IN_PROGRESS' ? 'bg-brand-500/20 text-brand-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {t.status}
                  </span>
                </div>
                <div className="mt-2 text-sm font-semibold text-white">{t.passenger}</div>
                <div className="mt-1 text-xs text-ink-400">
                  {t.pickup} → {t.dropoff}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-ink-400">{t.driver ? `Driver: ${t.driver}` : 'Awaiting driver'}</span>
                  <span className="font-semibold text-emerald-400">Br {t.fare}</span>
                </div>
                <div className="mt-1 text-[10px] text-ink-500">{t.requestedAgo}</div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
