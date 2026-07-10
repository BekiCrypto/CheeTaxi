'use client';

import { useEffect, useState } from 'react';
import { api, getTokens } from '@/lib/api';

interface DriverPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'ONLINE' | 'ON_TRIP' | 'OFFLINE';
  vehicle: string;
  distanceMeters?: number;
}

interface ActiveTrip {
  id: string;
  publicId: string;
  mode: string;
  status: string;
  totalFare: number;
  currency: string;
  pickupAddress: string;
  dropoffAddress: string;
  requestedAt: string;
  passengerUserId?: string;
  driverId?: string;
}

const ADDIS_CENTER = { lat: 9.0195, lng: 38.7525 };

export default function DispatcherConsole() {
  const [drivers, setDrivers] = useState<DriverPin[]>([]);
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<ActiveTrip | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!getTokens()) {
      // For dispatcher demo: show login prompt
      setAuthed(false);
      return;
    }
    setAuthed(true);

    const tick = async () => {
      try {
        const nearby = await api<DriverPin[]>(
          `/drivers/nearby?lat=${ADDIS_CENTER.lat}&lng=${ADDIS_CENTER.lng}&radius=10000&limit=50`,
        );
        setDrivers(nearby ?? []);
      } catch {
        // ignore — keep last
      }
    };

    tick();
    const driverTimer = setInterval(tick, 10_000);

    const clockTimer = setInterval(() => setNow(new Date()), 1000);

    return () => {
      clearInterval(driverTimer);
      clearInterval(clockTimer);
    };
  }, []);

  // Show recent trips via the public /trips/share/:token is not feasible without
  // a real admin endpoint. For an unauthenticated demo, show placeholder cards
  // explaining the dispatcher needs to be signed in.
  if (!authed) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="text-2xl font-bold text-white">Dispatcher authentication required</div>
        <div className="max-w-md text-ink-300">
          The dispatcher console requires an authenticated operations or dispatcher role.
          Sign in via the admin portal first, then return here.
        </div>
        <a
          href={process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3001/login'}
          className="btn-primary mt-4 no- underline"
        >
          Go to admin login
        </a>
      </div>
    );
  }

  const onlineCount = drivers.filter((d) => d.status !== 'OFFLINE').length;
  const onTripCount = drivers.filter((d) => d.status === 'ON_TRIP').length;
  const searchingCount = trips.filter((t) => t.status === 'SEARCHING' || t.status === 'REQUESTED').length;

  // Project lat/lng to SVG coordinates
  function project(lat: number, lng: number) {
    const minLat = 8.98, maxLat = 9.04, minLng = 38.74, maxLng = 38.80;
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 flex-none items-center justify-between border-b border-ink-700 bg-ink-800 px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-brand-500 text-sm font-bold text-white">C</div>
          <span className="font-bold text-white">CheeTaxi Dispatcher</span>
          <span className="ml-3 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">● Live</span>
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
        <div className="relative flex-1 bg-ink-900">
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
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

            <path d="M 0 50 L 100 50" stroke="#2A2E34" strokeWidth="1.5" />
            <path d="M 50 0 L 50 100" stroke="#2A2E34" strokeWidth="1.5" />
            <path d="M 0 30 Q 30 40 60 35 T 100 45" stroke="#2A2E34" strokeWidth="0.8" fill="none" />
            <path d="M 20 0 L 80 100" stroke="#2A2E34" strokeWidth="0.6" fill="none" />

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
            <div className="mb-2 font-bold text-ink-100">Addis Ababa · live</div>
            <div className="flex gap-3">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Online</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-brand-500" /> On trip</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-ink-400" /> Offline</span>
            </div>
          </div>

          {drivers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-ink-400">No drivers online nearby</div>
            </div>
          )}
        </div>

        <aside className="w-96 flex-none overflow-y-auto border-l border-ink-700 bg-ink-800">
          <div className="p-4">
            <h2 className="text-lg font-bold text-white">Driver roster</h2>
            <p className="text-xs text-ink-400">{drivers.length} drivers in view</p>
          </div>
          <div className="space-y-2 px-4 pb-4">
            {drivers.map((d) => (
              <div
                key={d.id}
                className="rounded-lg border border-ink-700 bg-ink-900 p-3 transition hover:border-brand-400"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white">{d.name}</div>
                  <span className={`badge ${d.status === 'ON_TRIP' ? 'bg-brand-500/20 text-brand-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {d.status}
                  </span>
                </div>
                <div className="mt-1 text-xs text-ink-400">{d.vehicle}</div>
                {d.distanceMeters != null && (
                  <div className="mt-1 text-[10px] text-ink-500">
                    {d.distanceMeters < 1000 ? `${Math.round(d.distanceMeters)} m away` : `${(d.distanceMeters / 1000).toFixed(1)} km away`}
                  </div>
                )}
              </div>
            ))}
            {drivers.length === 0 && (
              <div className="rounded-lg border border-dashed border-ink-700 p-6 text-center text-sm text-ink-400">
                No drivers in view. Waiting for location broadcasts…
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
