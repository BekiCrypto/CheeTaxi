import React, { useState } from 'react';
import {
  Package,
  MapPin,
  Navigation,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Share2,
  FileText,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import { DeliveryOrder, DeliveryPackageCategory, LocationPoint } from '@shared/types';
import { Language, translations } from '../../i18n/translations';
import { sounds } from '../../utils/audio';

interface RiderDeliveryPanelProps {
  currentRiderId: string;
  currentRiderName: string;
  currentRiderPhone: string;
  pickup: LocationPoint;
  destination: LocationPoint;
  language: Language;
}

export const RiderDeliveryPanel: React.FC<RiderDeliveryPanelProps> = ({
  currentRiderId,
  currentRiderName,
  currentRiderPhone,
  pickup,
  destination,
  language,
}) => {
  const t = translations[language];

  const [category, setCategory] = useState<DeliveryPackageCategory>('parcel');
  const [recipientName, setRecipientName] = useState('Dawit Bekele');
  const [recipientPhone, setRecipientPhone] = useState('+251922334455');
  const [packageDescription, setPackageDescription] = useState('Sealed legal document and business sample');
  const [weightKg, setWeightKg] = useState<number>(1.5);
  const [deliverySpeed, setDeliverySpeed] = useState<'express' | 'standard'>('express');
  const [paymentMethod, setPaymentMethod] = useState<'TELEBIRR' | 'CASH'>('TELEBIRR');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDelivery, setActiveDelivery] = useState<DeliveryOrder | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    sounds.playBeep(480, 'sine', 0.2);

    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentRiderId,
          senderName: currentRiderName,
          senderPhone: currentRiderPhone,
          recipientName,
          recipientPhone,
          pickup,
          dropoff: destination,
          category,
          packageDescription,
          weightKg,
          deliverySpeed,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (data.success && data.delivery) {
        sounds.playPaymentSuccess();
        setActiveDelivery(data.delivery);
      } else {
        setErrorMsg(data.error || 'Failed to request delivery.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error requesting delivery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!activeDelivery) return;
    try {
      const res = await fetch(`/api/deliveries/${activeDelivery.id}`);
      const data = await res.json();
      if (data.delivery) {
        setActiveDelivery(data.delivery);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {errorMsg && (
        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeDelivery ? (
        <div className="bg-white rounded-2xl border-2 border-brand-500 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-600" />
              <div>
                <span className="font-black text-sm text-slate-900 block">
                  Delivery #{activeDelivery.id.slice(-6)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(activeDelivery.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-brand-100 text-brand-800">
              {activeDelivery.status}
            </span>
          </div>

          {/* DUAL OTP SECURITY SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Pickup OTP */}
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-brand-700 block uppercase tracking-wider">
                1. Pickup OTP (Give to Driver)
              </span>
              <div className="text-2xl font-black font-mono tracking-widest text-brand-900 my-1">
                {activeDelivery.pickupOtp}
              </div>
              <p className="text-[10px] text-brand-600">
                Driver must enter this 4-digit code at pickup before leaving with package.
              </p>
            </div>

            {/* Dropoff OTP */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-emerald-700 block uppercase tracking-wider">
                2. Dropoff OTP (Give to Recipient)
              </span>
              <div className="text-2xl font-black font-mono tracking-widest text-emerald-900 my-1">
                {activeDelivery.dropoffOtp}
              </div>
              <p className="text-[10px] text-emerald-600">
                Send to {activeDelivery.recipientName} ({activeDelivery.recipientPhone}) to confirm safe arrival.
              </p>
            </div>
          </div>

          {/* Route Summary */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-slate-700 font-medium">{activeDelivery.pickup.address}</span>
            </div>
            <div className="flex items-start gap-2">
              <Navigation className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
              <span className="text-slate-700 font-medium">{activeDelivery.dropoff.address}</span>
            </div>
          </div>

          {/* Fee & Action */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Delivery Fare</span>
              <span className="text-base font-black text-slate-900">
                {activeDelivery.totalEtb} ETB
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRefreshStatus}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setActiveDelivery(null)}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg transition"
              >
                New Delivery
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Delivery Booking Form */
        <form onSubmit={handleCreateDelivery} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-black text-slate-900 text-sm">Send Package Across Addis</span>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              Dual-OTP Protected
            </span>
          </div>

          {/* Category Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Package Category</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'parcel', label: 'Parcel' },
                { id: 'document', label: 'Document' },
                { id: 'food', label: 'Food' },
                { id: 'grocery', label: 'Grocery' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id as DeliveryPackageCategory)}
                  className={`py-2 px-1 text-center rounded-lg border text-xs font-bold transition ${
                    category === c.id
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Package Contents</label>
            <input
              type="text"
              required
              value={packageDescription}
              onChange={(e) => setPackageDescription(e.target.value)}
              placeholder="e.g. Signed contract, electronics, medicine"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Recipient Details */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Recipient Name</label>
              <input
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Recipient Phone</label>
              <input
                type="text"
                required
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Speed & Payment */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Speed</label>
              <select
                value={deliverySpeed}
                onChange={(e) => setDeliverySpeed(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
              >
                <option value="express">Express (Urgent)</option>
                <option value="standard">Standard (Economy)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Payment</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
              >
                <option value="TELEBIRR">Telebirr Wallet</option>
                <option value="CASH">Cash on Pickup</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Package className="w-4 h-4" />
            <span>{isSubmitting ? 'Dispatching Courier...' : 'Request Delivery Dispatch'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
