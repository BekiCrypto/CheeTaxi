import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Zap,
  Calendar,
  Clock,
  CreditCard,
  ShieldCheck,
  Gift,
  RefreshCw,
  Sparkles,
  Award,
} from 'lucide-react';
import { Driver, SubscriptionPlan, DriverSubscription } from '@shared/types';
import { Language, translations } from '../../i18n/translations';
import { sounds } from '../../utils/audio';

interface DriverSubscriptionTabProps {
  driver: Driver;
  language: Language;
  onRefreshDriver: () => void;
}

export const DriverSubscriptionTab: React.FC<DriverSubscriptionTabProps> = ({
  driver,
  language,
  onRefreshDriver,
}) => {
  const t = translations[language];

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<DriverSubscription | null>(null);
  const [history, setHistory] = useState<DriverSubscription[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan_monthly_sedan');
  const [paymentMethod, setPaymentMethod] = useState<'TELEBIRR' | 'CASH'>('TELEBIRR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSubscriptionData = async () => {
    try {
      const [plansRes, activeRes, historyRes] = await Promise.all([
        fetch('/api/subscriptions/plans'),
        fetch(`/api/subscriptions/active/${driver.id}`),
        fetch(`/api/subscriptions/history/${driver.id}`),
      ]);

      const plansData = await plansRes.json();
      if (plansData.plans) setPlans(plansData.plans);

      const activeData = await activeRes.json();
      if (activeData.subscription) {
        setActiveSubscription(activeData.subscription);
      } else {
        setActiveSubscription(null);
      }

      const historyData = await historyRes.json();
      if (historyData.subscriptions) setHistory(historyData.subscriptions);
    } catch (err) {
      console.error('Error loading subscription data:', err);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, [driver.id]);

  const handlePurchase = async () => {
    setIsProcessing(true);
    setActionMessage(null);
    sounds.playBeep(440, 'sine', 0.15);

    try {
      const res = await fetch('/api/subscriptions/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: driver.id,
          planId: selectedPlanId,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (data.success && data.subscription) {
        sounds.playPaymentSuccess();
        setActionMessage({
          type: 'success',
          text: `Successfully subscribed to ${data.subscription.planName}! 0% trip commission enabled until ${new Date(
            data.subscription.endDate
          ).toLocaleDateString()}.`,
        });
        await loadSubscriptionData();
        onRefreshDriver();
      } else {
        setActionMessage({
          type: 'error',
          text: data.error || 'Failed to complete subscription purchase.',
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Network error purchasing subscription.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClaimTrial = async () => {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/subscriptions/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: driver.id }),
      });
      const data = await res.json();
      if (data.success && data.subscription) {
        sounds.playPaymentSuccess();
        setActionMessage({
          type: 'success',
          text: '7-Day Free Trial activated! Drive with 0% commission.',
        });
        await loadSubscriptionData();
        onRefreshDriver();
      } else {
        setActionMessage({
          type: 'error',
          text: data.error || 'Could not claim trial.',
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Trial activation failed.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Active Subscription (0% Commission)
          </span>
        );
      case 'grace_period':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Grace Period (Renew Now)
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Expired (Trips Blocked)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            No Active Subscription
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Founder Mandate 0% Commission Banner */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-amber-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-400 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Founder Mandate
              </span>
              <span className="text-white/80 text-xs font-medium">0% Per-Trip Commission</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Keep 100% of Every Fare You Drive</h2>
            <p className="text-white/90 text-sm mt-1 max-w-xl">
              Unlike traditional apps taking 15%–25% of your hard-earned money on every single ride,
              Chebelew charges a transparent, flat subscription. Unlimited rides, zero commission, zero earnings cap.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end">
            <div className="text-3xl font-black text-amber-300">0%</div>
            <div className="text-xs uppercase tracking-wider text-white/80 font-bold">Platform Take Rate</div>
          </div>
        </div>
      </div>

      {/* Current Subscription Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Driver Entitlement</span>
            <div className="mt-1 flex items-center gap-3">
              <h3 className="text-xl font-black text-slate-900">{driver.fullName}</h3>
              {getStatusBadge(driver.subscriptionStatus || 'none')}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Vehicle: {driver.vehicleMake} {driver.vehicleModel} ({driver.vehiclePlate}) • {driver.vehicleCategory}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!activeSubscription && (
              <button
                onClick={handleClaimTrial}
                disabled={isProcessing}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-300 flex items-center gap-1.5 transition"
              >
                <Gift className="w-4 h-4 text-amber-600" />
                Claim 7-Day Free Trial
              </button>
            )}
            <button
              onClick={() => {
                loadSubscriptionData();
                onRefreshDriver();
              }}
              className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition"
              title="Refresh status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {activeSubscription ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Active Plan</span>
              <span className="font-bold text-slate-900">{activeSubscription.planName}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Billing Period</span>
              <span className="font-bold text-slate-900 capitalize">{activeSubscription.billingPeriod}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Expires On</span>
              <span className="font-bold text-slate-900">
                {new Date(activeSubscription.endDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Amount Paid</span>
              <span className="font-bold text-emerald-700">
                {activeSubscription.amountPaid} {activeSubscription.currency}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">No Active Subscription Detected</span>
              You are currently unable to receive ride requests. Select a subscription plan below to immediately activate your dispatch availability and keep 100% of all fares.
            </div>
          </div>
        )}
      </div>

      {/* Plan Selection Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-lg font-black text-slate-900 mb-1">Select Driver Subscription Plan</h3>
        <p className="text-xs text-slate-500 mb-6">
          Transparent, fixed rates configured for Addis Ababa, Ethiopia. No per-ride deductions.
        </p>

        {actionMessage && (
          <div
            className={`p-4 rounded-xl text-xs mb-6 font-medium flex items-center gap-2 ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            {actionMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
          {plans.map((p) => {
            const isSelected = selectedPlanId === p.id;
            const isPopular = p.billingPeriod === 'monthly' || p.billingPeriod === 'weekly';
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlanId(p.id)}
                className={`relative rounded-xl p-4 border cursor-pointer transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50/50 shadow-sm ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {p.billingPeriod === 'monthly' ? 'Best Value' : 'Popular'}
                  </span>
                )}
                <div>
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">{p.name}</div>
                  <div className="text-[10px] text-brand-600 font-medium">{p.nameAm}</div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">{p.priceAmount}</span>
                    <span className="text-xs font-bold text-slate-500">{p.currency}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {p.durationDays} {p.durationDays === 1 ? 'day' : 'days'}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
                  {p.features?.slice(0, 3).map((f, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Method Selector & Purchase Button */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Payment Option:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('TELEBIRR')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  paymentMethod === 'TELEBIRR'
                    ? 'bg-[#005cb9] text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <span>telebirr</span>
                <span className="text-[10px] bg-white/20 px-1 rounded">Instant</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  paymentMethod === 'CASH'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <span>Cash at Hub</span>
              </button>
            </div>
          </div>

          <button
            onClick={handlePurchase}
            disabled={isProcessing}
            className="w-full md:w-auto px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 text-amber-300" />
            )}
            <span>Activate Subscription Now</span>
          </button>
        </div>
      </div>

      {/* Subscription History */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-black text-slate-900 mb-3">Subscription History</h3>
          <div className="divide-y divide-slate-100">
            {history.map((h) => (
              <div key={h.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{h.planName}</span>
                  <span className="text-slate-500 ml-2">
                    {new Date(h.startDate).toLocaleDateString()} – {new Date(h.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900">
                    {h.amountPaid} {h.currency}
                  </span>
                  <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    {h.paymentMethod}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      h.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {h.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
