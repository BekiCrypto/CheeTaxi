import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Phone, AlertTriangle, Share2, Check, ArrowRight,
  Car, Clock, Navigation, MapPin, Receipt, ExternalLink, RefreshCw
} from 'lucide-react';
import { AddisMap } from '../Map/AddisMap';
import { useSocket } from '../../hooks/useSocket';
import { Ride } from '@shared/types';

interface PublicTripTrackerProps {
  rideId: string;
}

export const PublicTripTracker: React.FC<PublicTripTrackerProps> = ({ rideId }) => {
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [liveDriverPos, setLiveDriverPos] = useState<{ lat: number; lng: number; heading?: number } | null>(null);

  const { socket } = useSocket();

  const fetchRide = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/rides/${rideId}`);
      if (!res.ok) {
        throw new Error('Ride tracking session not found or expired.');
      }
      const data = await res.json();
      if (data.ride) {
        setRide(data.ride);
        if (data.ride.currentDriverLocation) {
          setLiveDriverPos({ lat: data.ride.currentDriverLocation[0], lng: data.ride.currentDriverLocation[1] });
        } else if (data.ride.driver) {
          setLiveDriverPos({ lat: data.ride.driver.currentLat, lng: data.ride.driver.currentLng, heading: data.ride.driver.heading });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load live ride data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rideId) {
      fetchRide();
    }
  }, [rideId]);

  // Real-time socket listeners for live tracking
  useEffect(() => {
    if (!socket || !rideId) return;

    const handleLocationUpdate = (data: { driverId: string; lat: number; lng: number; heading?: number }) => {
      if (ride?.driverId && data.driverId === ride.driverId) {
        setLiveDriverPos({ lat: data.lat, lng: data.lng, heading: data.heading });
      }
    };

    const handleRideUpdate = (updatedRide: Ride) => {
      if (updatedRide.id === rideId) {
        setRide(updatedRide);
        if (updatedRide.currentDriverLocation) {
          setLiveDriverPos({ lat: updatedRide.currentDriverLocation[0], lng: updatedRide.currentDriverLocation[1] });
        } else if (updatedRide.driver) {
          setLiveDriverPos({ lat: updatedRide.driver.currentLat, lng: updatedRide.driver.currentLng, heading: updatedRide.driver.heading });
        }
      }
    };

    socket.on('driver:location_update', handleLocationUpdate);
    socket.on('ride:status_change', handleRideUpdate);
    socket.on('ride:updated', handleRideUpdate);

    return () => {
      socket.off('driver:location_update', handleLocationUpdate);
      socket.off('ride:status_change', handleRideUpdate);
      socket.off('ride:updated', handleRideUpdate);
    };
  }, [socket, rideId, ride?.driverId]);

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold">Connecting to Chebelew Live Satellite Radar...</h2>
        <p className="text-sm text-slate-400 mt-1">Retrieving encrypted GPS telemetry for Ride #{rideId.slice(0, 8)}</p>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Trip Tracking Session Unavailable</h2>
        <p className="text-sm text-slate-400 max-w-md mt-2">
          {error || 'This ride link is invalid, has concluded, or privacy protection is enabled.'}
        </p>
        <button
          onClick={fetchRide}
          className="mt-6 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl flex items-center gap-2 transition-colors shadow-lg"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (ride.status) {
      case 'REQUESTED':
        return { label: 'Finding Nearest Driver', color: 'bg-amber-500 text-slate-950 animate-pulse' };
      case 'ASSIGNED':
        return { label: 'Driver Assigned & En Route', color: 'bg-blue-600 text-white' };
      case 'ARRIVED':
        return { label: 'Driver Arrived at Pickup', color: 'bg-purple-600 text-white' };
      case 'IN_PROGRESS':
        return { label: 'Trip In Progress to Destination', color: 'bg-emerald-600 text-white' };
      case 'COMPLETED':
        return { label: 'Trip Completed Safely', color: 'bg-slate-700 text-emerald-400' };
      case 'CANCELLED':
        return { label: 'Trip Cancelled', color: 'bg-rose-600 text-white' };
      default:
        return { label: ride.status, color: 'bg-slate-700 text-white' };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative">
      {/* Top Banner for Mobile */}
      <div className="md:hidden bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-3.5 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-black text-slate-950 text-sm">
            ቼ
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider text-slate-200 uppercase">CHEBELEW SAFETRIP</h1>
            <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              LIVE TELEMETRY
            </p>
          </div>
        </div>
        <button
          onClick={handleCopyShareLink}
          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Share'}</span>
        </button>
      </div>

      {/* Map View Area */}
      <div className="flex-1 h-[55vh] md:h-screen relative z-0">
        <AddisMap
          pickup={ride.pickup}
          destination={ride.destination}
          routeCoordinates={ride.routeCoordinates || []}
          activeDriverLocation={liveDriverPos ? [liveDriverPos.lat, liveDriverPos.lng] : (ride.currentDriverLocation || (ride.driver ? [ride.driver.currentLat, ride.driver.currentLng] : undefined))}
          activeDriverHeading={liveDriverPos?.heading || ride.driver?.heading || 0}
          activeDriverPlate={ride.driver?.vehiclePlate}
          className="h-full w-full"
        />

        {/* Floating Desktop Top Bar */}
        <div className="hidden md:flex absolute top-4 left-4 z-[1000] bg-slate-900/85 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-3.5 shadow-2xl items-center gap-4">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-black text-slate-950 text-lg shadow-md">
            ቼ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wide text-white">CHEBELEW SAFETRIP LIVE</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> REALTIME
              </span>
            </div>
            <p className="text-xs text-slate-400">Addis Ababa City Emergency & Family Share Console</p>
          </div>
          <button
            onClick={handleCopyShareLink}
            className="ml-4 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Link Copied!' : 'Copy Share Link'}</span>
          </button>
        </div>
      </div>

      {/* Side Information Sheet */}
      <div className="w-full md:w-[420px] bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col justify-between overflow-y-auto max-h-[45vh] md:max-h-screen z-10 shadow-2xl p-5 space-y-4">
        <div>
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              ID: {ride.id.slice(0, 12)}
            </span>
          </div>

          {/* Passenger & Driver Overview Card */}
          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 space-y-3.5 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-700 border-2 border-amber-500/60 flex items-center justify-center font-bold text-amber-400 text-lg">
                  {ride.driver?.fullName ? ride.driver.fullName.charAt(0) : 'D'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {ride.driver?.fullName || 'Matching Licensed Driver...'}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {ride.driver
                        ? `${ride.driver.vehicleMake} ${ride.driver.vehicleModel} (${ride.driver.vehicleColor})`
                        : 'Toyota Corolla (White)'}
                    </span>
                  </p>
                </div>
              </div>

              {ride.driver?.vehiclePlate && (
                <div className="px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-700 text-center font-mono font-bold text-xs text-amber-400">
                  {ride.driver.vehiclePlate}
                </div>
              )}
            </div>

            {/* Passenger Info */}
            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
              <span>Passenger: <strong className="text-white">{ride.riderName}</strong></span>
              {ride.driver?.phone && (
                <a
                  href={`tel:${ride.driver.phone}`}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Driver
                </a>
              )}
            </div>
          </div>

          {/* Trip Route Details */}
          <div className="space-y-3 bg-slate-800/40 rounded-2xl p-3.5 border border-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 shrink-0 ring-4 ring-emerald-500/20" />
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Pickup Location</p>
                <p className="text-xs font-semibold text-slate-200 line-clamp-1">{ride.pickup?.address || 'Pickup Point'}</p>
              </div>
            </div>

            <div className="ml-1.5 w-0.5 h-4 bg-slate-700 border-l border-dashed" />

            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500 mt-1 shrink-0 ring-4 ring-amber-500/20" />
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Destination</p>
                <p className="text-xs font-semibold text-slate-200 line-clamp-1">{ride.destination?.address || 'Destination'}</p>
              </div>
            </div>
          </div>

          {/* Fare & Regulation 570/2025 Notice */}
          <div className="mt-3.5 bg-slate-800/50 rounded-xl p-3 border border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between items-center text-slate-300">
              <span>Estimated Payable Fare:</span>
              <span className="font-extrabold text-amber-400 text-sm">{ride.fare?.totalFare || 0} ETB</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>FDRE Ministry of Revenues 15% VAT:</span>
              <span>{ride.fare?.vatAmount || 0} ETB (Reg 570/2025)</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-emerald-400">
              <span>Chebelew Commission Take Rate:</span>
              <span className="font-bold">0% Direct to Driver</span>
            </div>
          </div>
        </div>

        {/* Emergency & Support Hub */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <a
              href="tel:991"
              className="py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg transition"
            >
              <AlertTriangle className="w-4 h-4" /> Police SOS (991)
            </a>
            <a
              href="tel:9922"
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition"
            >
              <ShieldCheck className="w-4 h-4" /> Safety Center 9922
            </a>
          </div>
          <p className="text-[10px] text-center text-slate-500">
            Encrypted GPS coordinates shared under Ethiopian Transport Authority guidelines.
          </p>
        </div>
      </div>
    </div>
  );
};
