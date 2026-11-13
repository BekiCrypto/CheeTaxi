import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import {
  DriverSubscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../../../shared/types.js';

export class SubscriptionService {
  /**
   * Retrieves all active subscription plans for a country and city
   */
  static getPlans(countryCode: string = 'ET', cityCode: string = 'ADDIS_ABABA'): SubscriptionPlan[] {
    const rows = db.prepare(`
      SELECT * FROM subscription_plans
      WHERE country_code = ? AND city_code = ? AND is_active = 1
      ORDER BY duration_days ASC
    `).all(countryCode, cityCode) as any[];

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      nameAm: r.name_am,
      billingPeriod: r.billing_period,
      durationDays: r.duration_days,
      priceAmount: r.price_amount,
      currency: r.currency,
      countryCode: r.country_code,
      cityCode: r.city_code,
      vehicleCategory: r.vehicle_category,
      isActive: Boolean(r.is_active),
      features: r.features_json ? JSON.parse(r.features_json) : [],
    }));
  }

  /**
   * Checks driver's entitlement to go online and receive bookings.
   * Founder Mandate: Subscribed drivers have UNLIMITED rides and 0% per-trip commission!
   * Unsubscribed or expired drivers are blocked from going online.
   */
  static checkDriverEntitlement(driverId: string): {
    driverId: string;
    entitled: boolean;
    isEligibleToGoOnline: boolean;
    status: SubscriptionStatus;
    expiresAt?: string;
    reason?: string;
    planName?: string;
  } {
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driverId) as any;
    if (!driver) {
      return { driverId, entitled: false, isEligibleToGoOnline: false, status: 'expired', reason: 'Driver not found' };
    }

    if (!driver.active_subscription_id) {
      return {
        driverId,
        entitled: false,
        isEligibleToGoOnline: false,
        status: 'expired',
        reason: 'No active subscription. Please select a Chebelew subscription pass.',
      };
    }

    const sub = db.prepare('SELECT * FROM driver_subscriptions WHERE id = ?').get(
      driver.active_subscription_id
    ) as any;

    if (!sub) {
      return { driverId, entitled: false, isEligibleToGoOnline: false, status: 'expired', reason: 'Subscription record missing' };
    }

    const now = new Date();
    const expiry = new Date(sub.end_date);

    // Active
    if (now <= expiry) {
      return {
        driverId,
        entitled: true,
        isEligibleToGoOnline: true,
        status: 'active',
        expiresAt: sub.end_date,
        planName: sub.plan_name,
      };
    }

    // Grace period check (24 hours post-expiry)
    const graceEnds = new Date(expiry.getTime() + 24 * 60 * 60 * 1000);
    if (now <= graceEnds) {
      return {
        driverId,
        entitled: true,
        isEligibleToGoOnline: true,
        status: 'grace_period',
        expiresAt: graceEnds.toISOString(),
        reason: 'Subscription expired. You are currently in a 24-hour grace period.',
        planName: sub.plan_name,
      };
    }

    // Expired
    db.prepare(`
      UPDATE drivers
      SET subscription_status = 'expired', is_online = 0
      WHERE id = ?
    `).run(driverId);

    db.prepare(`
      UPDATE driver_subscriptions
      SET status = 'expired'
      WHERE id = ?
    `).run(sub.id);

    return {
      driverId,
      entitled: false,
      isEligibleToGoOnline: false,
      status: 'expired',
      expiresAt: sub.end_date,
      reason: 'Subscription expired. Renew pass to go online and receive ride requests.',
      planName: sub.plan_name,
    };
  }

  /**
   * Activates or renews a driver subscription pass
   */
  static subscribe(
    driverId: string,
    planId: string,
    paymentMethod: 'TELEBIRR' | 'CASH' | 'BANK_TRANSFER' = 'TELEBIRR',
    paymentReference?: string
  ): DriverSubscription {
    const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(planId) as any;
    if (!plan) {
      throw new Error('Subscription plan not found');
    }

    const subId = `sub_${uuidv4().substring(0, 8)}`;
    const now = new Date();
    const endDate = new Date(now.getTime() + plan.duration_days * 86400000);
    const graceEnds = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);

    const stmt = db.prepare(`
      INSERT INTO driver_subscriptions (
        id, driver_id, plan_id, plan_name, billing_period, status,
        start_date, end_date, grace_period_ends_at, auto_renew,
        amount_paid, currency, payment_method, payment_reference, created_at, updated_at
      ) VALUES (
        @id, @driverId, @planId, @planName, @billingPeriod, 'active',
        @startDate, @endDate, @gracePeriodEndsAt, 1,
        @amountPaid, @currency, @paymentMethod, @paymentReference, @createdAt, @updatedAt
      )
    `);

    stmt.run({
      id: subId,
      driverId,
      planId: plan.id,
      planName: plan.name,
      billingPeriod: plan.billing_period,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      gracePeriodEndsAt: graceEnds.toISOString(),
      amountPaid: plan.price_amount,
      currency: plan.currency,
      paymentMethod,
      paymentReference: paymentReference || `TB_SUB_${Date.now().toString().slice(-6)}`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    // Update driver entitlement record
    db.prepare(`
      UPDATE drivers
      SET subscription_status = 'active',
          subscription_expires_at = ?,
          active_subscription_id = ?
      WHERE id = ?
    `).run(endDate.toISOString(), subId, driverId);

    return {
      id: subId,
      driverId,
      planId: plan.id,
      planName: plan.name,
      billingPeriod: plan.billing_period,
      status: 'active',
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      gracePeriodEndsAt: graceEnds.toISOString(),
      autoRenew: true,
      amountPaid: plan.price_amount,
      currency: plan.currency,
      paymentMethod,
      paymentReference,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  /**
   * Admin-issued trial or sponsored subscription
   */
  static grantTrialOrSponsored(
    driverId: string,
    durationDays: number = 7,
    reason: string = 'Founder Onboarding Promo'
  ): DriverSubscription {
    const subId = `sub_promo_${uuidv4().substring(0, 8)}`;
    const now = new Date();
    const endDate = new Date(now.getTime() + durationDays * 86400000);

    // Ensure sponsored plan exists in subscription_plans for foreign key constraint
    const existingPlan = db.prepare('SELECT id FROM subscription_plans WHERE id = ?').get('plan_sponsored');
    if (!existingPlan) {
      db.prepare(`
        INSERT INTO subscription_plans (
          id, name, name_am, billing_period, duration_days, price_amount, currency,
          country_code, city_code, vehicle_category, is_active, created_at
        ) VALUES (
          'plan_sponsored', 'Sponsored Trial Pass', 'የስፖንሰር የተደረገ የሙከራ ፓስ',
          'weekly', 7, 0.0, 'ETB', 'ET', 'ADDIS_ABABA', 'sedan', 1, ?
        )
      `).run(now.toISOString());
    }

    db.prepare(`
      INSERT INTO driver_subscriptions (
        id, driver_id, plan_id, plan_name, billing_period, status,
        start_date, end_date, auto_renew, amount_paid, currency,
        payment_method, payment_reference, created_at, updated_at
      ) VALUES (
        ?, ?, 'plan_sponsored', ?, 'weekly', 'active',
        ?, ?, 0, 0.0, 'ETB', 'CASH', ?, ?, ?
      )
    `).run(
      subId,
      driverId,
      `Sponsored Trial (${reason})`,
      now.toISOString(),
      endDate.toISOString(),
      'ADMIN_SPONSORED',
      now.toISOString(),
      now.toISOString()
    );

    db.prepare(`
      UPDATE drivers
      SET subscription_status = 'active',
          subscription_expires_at = ?,
          active_subscription_id = ?
      WHERE id = ?
    `).run(endDate.toISOString(), subId, driverId);

    return {
      id: subId,
      driverId,
      planId: 'plan_sponsored',
      planName: `Sponsored Trial (${reason})`,
      billingPeriod: 'weekly',
      status: 'active',
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      autoRenew: false,
      amountPaid: 0.0,
      currency: 'ETB',
      paymentMethod: 'CASH',
      paymentReference: 'ADMIN_SPONSORED',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }
}
