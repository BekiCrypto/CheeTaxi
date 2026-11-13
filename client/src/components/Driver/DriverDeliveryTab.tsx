import React, { useState, useEffect } from 'react';
import {
  Package,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Phone,
  ShieldCheck,
  Camera,
  Navigation,
  Clock,
  ArrowRight,
  RefreshCw,
  KeyRound,
  FileText,
  ShoppingBag,
} from 'lucide-react';
import { DeliveryOrder, Driver } from '@shared/types';
import { Language, translations } from '../../i18n/translations';
import { sounds } from '../../utils/audio';

interface DriverDeliveryTabProps {
  driver: Driver;
  language: Language;
}

export const DriverDeliveryTab: React.FC<DriverDeliveryTabProps> = ({
  driver,
  language,
}) => {
  const t = translations[language];

  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<DeliveryOrder | null>(null);
  const [pickupOtpInput, setPickupOtpInput] = useState('');
  const [dropoffOtpInput, setDropoffOtpInput] = useState('');
  const [photoProofUrl, setPhotoProofUrl] = useState('https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400');
  const [recipientSignature, setRecipientSignature] = useState('Recipient Signature Verified');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDeliveries = async () => {
    try {
      const res = await fetch('/api/deliveries/active');
      const data = await res.json();
      if (data.deliveries) {
        // Find if this driver is assigned to one
        const mine = data.deliveries.find((d: DeliveryOrder) => d.courierId === driver.id);
        if (mine) {
          setActiveDelivery(mine);
        } else {
          setActiveDelivery(null);
        }
        // Available for pickup
        const unassigned = data.deliveries.filter((d: DeliveryOrder) => d.status === 'REQUESTED');
        setAvailableOrders(unassigned);
      }
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    }
  };

  useEffect(() => {
    loadDeliveries();
    const interval = setInterval(loadDeliveries, 5000);
    return () => clearInterval(interval);
  }, [driver.id]);

  const handleAcceptDelivery = async (orderId: string) => {
    setIsSubmitting(true);
    setActionError(null);
    sounds.playBeep(520, 'sine', 0.2);

    try {
      const res = await fetch(`/api/deliveries/${orderId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courierId: driver.id }),
      });
      const data = await res.json();
      if (data.success && data.delivery) {
        sounds.playRideAccepted();
        setActiveDelivery(data.delivery);
        setActionSuccess(`Delivery accepted! Head to pickup at ${data.delivery.pickup.address}.`);
        await loadDeliveries();
      } else {
        setActionError(data.error || 'Failed to accept delivery.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error accepting delivery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPickupOtp = async () => {
    if (!activeDelivery) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/deliveries/${activeDelivery.id}/pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courierId: driver.id,
          pickupOtp: pickupOtpInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.delivery) {
        sounds.playPaymentSuccess();
        setActiveDelivery(data.delivery);
        setPickupOtpInput('');
        setActionSuccess('Pickup OTP verified! Package is now IN_TRANSIT to destination.');
        await loadDeliveries();
      } else {
        setActionError(data.error || 'Incorrect Pickup OTP.');
        sounds.playBeep(220, 'sawtooth', 0.3);
      }
    } catch (err: any) {
      setActionError(err.message || 'Error verifying pickup OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyDropoffOtp = async () => {
    if (!activeDelivery) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/deliveries/${activeDelivery.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courierId: driver.id,
          dropoffOtp: dropoffOtpInput.trim(),
          photoProofUrl,
          recipientSignature,
        }),
      });
      const data = await res.json();
      if (data.success && data.delivery) {
        sounds.playPaymentSuccess();
        setActiveDelivery(null);
        setDropoffOtpInput('');
        setActionSuccess('Delivery completed and signed! Earnings credited to your driver wallet.');
        await loadDeliveries();
      } else {
        setActionError(data.error || 'Incorrect Dropoff OTP.');
        sounds.playBeep(220, 'sawtooth', 0.3);
      }
    } catch (err: any) {
      setActionError(err.message || 'Error completing delivery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-100 text-blue-800 text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Logistics & Courier Mode
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Chebelew Delivery Marketplace</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deliver parcels, legal documents, food and groceries across Addis Ababa with dual-OTP security.
          </p>
        </div>
        <button
          onClick={loadDeliveries}
          className="p-2.5 hover:bg-slate-100 text-slate-600 rounded-xl transition flex items-center gap-1.5 text-xs font-bold self-start md:self-center"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {actionError && (
        <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {actionSuccess}
        </div>
      )}

      {/* Active Delivery Card */}
      {activeDelivery ? (
        <div className="bg-white rounded-2xl border-2 border-brand-500 p-6 shadow-md">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-600" />
              <span className="font-black text-base text-slate-900">Active Delivery Order</span>
              <span className="text-xs bg-brand-100 text-brand-800 font-bold px-2 py-0.5 rounded-full uppercase">
                {activeDelivery.status}
              </span>
            </div>
            <div className="text-sm font-black text-emerald-700">
              {activeDelivery.totalEtb} ETB
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Sender / Pickup */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Step 1: Sender & Pickup
              </div>
              <div className="text-sm font-bold text-slate-900">{activeDelivery.senderName}</div>
              <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                {activeDelivery.senderPhone}
              </div>
              <div className="text-xs text-slate-700 mt-2 font-medium">{activeDelivery.pickup.address}</div>
            </div>

            {/* Recipient / Dropoff */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-brand-600" />
                Step 2: Recipient & Dropoff
              </div>
              <div className="text-sm font-bold text-slate-900">{activeDelivery.recipientName}</div>
              <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                {activeDelivery.recipientPhone}
              </div>
              <div className="text-xs text-slate-700 mt-2 font-medium">{activeDelivery.dropoff.address}</div>
            </div>
          </div>

          {/* Package details */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-6 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 font-medium">Package: </span>
              <span className="font-bold text-slate-800">{activeDelivery.packageDescription}</span>
              <span className="text-slate-400 ml-2">({activeDelivery.category}, {activeDelivery.deliverySpeed})</span>
            </div>
            {activeDelivery.weightKg && (
              <span className="font-bold text-slate-600">{activeDelivery.weightKg} kg</span>
            )}
          </div>

          {/* Verification Step: Pickup OTP vs Dropoff OTP */}
          {activeDelivery.status === 'ASSIGNED' && (
            <div className="bg-brand-50 p-4 rounded-xl border border-brand-200">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="w-4 h-4 text-brand-700" />
                <span className="text-xs font-bold text-brand-900 uppercase tracking-wider">
                  Pickup Handover: Ask Sender for 4-Digit Pickup OTP
                </span>
              </div>
              <p className="text-xs text-brand-700 mb-3">
                For security, the sender has a 4-digit OTP shown on their screen. Ask them for this code before taking possession of the package.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. 5812"
                  value={pickupOtpInput}
                  onChange={(e) => setPickupOtpInput(e.target.value)}
                  className="px-3 py-2 bg-white border border-brand-300 rounded-lg text-sm font-mono font-bold tracking-widest text-slate-900 w-36 text-center"
                />
                <button
                  onClick={handleVerifyPickupOtp}
                  disabled={pickupOtpInput.length !== 4 || isSubmitting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  Verify Pickup OTP
                </button>
              </div>
            </div>
          )}

          {(activeDelivery.status === 'PICKED_UP' || activeDelivery.status === 'IN_TRANSIT') && (
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Dropoff Handover: Ask Recipient for 4-Digit Dropoff OTP
                </span>
              </div>
              <p className="text-xs text-emerald-700 mb-3">
                Package is in transit. When arriving at dropoff, collect the 4-digit Dropoff OTP from recipient ({activeDelivery.recipientName}) and verify photo proof of delivery.
              </p>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="e.g. 8491"
                    value={dropoffOtpInput}
                    onChange={(e) => setDropoffOtpInput(e.target.value)}
                    className="px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-mono font-bold tracking-widest text-slate-900 w-36 text-center"
                  />
                  <button
                    onClick={handleVerifyDropoffOtp}
                    disabled={dropoffOtpInput.length !== 4 || isSubmitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition disabled:opacity-50"
                  >
                    Complete Delivery
                  </button>
                </div>
                <div className="text-[11px] text-emerald-700 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Photo proof & electronic signature auto-staged for delivery record.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Available Orders List */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-black text-slate-900 mb-3">
            Open Delivery Requests ({availableOrders.length})
          </h3>
          {availableOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No open delivery requests in Addis Ababa right now. New requests appear automatically.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {availableOrders.map((ord) => (
                <div key={ord.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{ord.packageDescription}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {ord.category}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{ord.pickup.address}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{ord.dropoff.address}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Sender: {ord.senderName} • Recipient: {ord.recipientName}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-base font-black text-slate-900">{ord.totalEtb} ETB</div>
                      <div className="text-[10px] text-slate-400 font-medium">Estimated payout</div>
                    </div>
                    <button
                      onClick={() => handleAcceptDelivery(ord.id)}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
