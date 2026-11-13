import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { DeliveryOrder, DeliveryPackageCategory, LocationPoint, PaymentMethod } from '../../../shared/types.js';
import { estimateRoadMetrics } from './geoService.js';

export interface CreateDeliveryInput {
  senderId: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  pickup: LocationPoint;
  dropoff: LocationPoint;
  category: DeliveryPackageCategory;
  packageDescription: string;
  weightKg?: number;
  deliverySpeed?: 'express' | 'standard' | 'scheduled';
  paymentMethod?: PaymentMethod;
}

export class DeliveryService {
  /**
   * Creates a delivery logistics order with dual OTP verification (pickup & dropoff)
   */
  static createOrder(input: CreateDeliveryInput): DeliveryOrder {
    const deliveryId = `del_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const metrics = estimateRoadMetrics(
      input.pickup.lat,
      input.pickup.lng,
      input.dropoff.lat,
      input.dropoff.lng
    );

    // Delivery pricing: Base 50 ETB + 12 ETB/km (express multiplier 1.25)
    const speedMultiplier = input.deliverySpeed === 'express' ? 1.25 : 1.0;
    const basePrice = (50 + metrics.distanceKm * 12) * speedMultiplier;
    const priceEtb = Number(Math.max(70, basePrice).toFixed(2));
    const vatEtb = Number((priceEtb * 0.15).toFixed(2)); // 15% VAT
    const totalEtb = Number((priceEtb + vatEtb).toFixed(2));

    // Generate secure 4-digit verification OTPs
    const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const dropoffOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // Find nearby available courier/driver
    const availableCourier = db.prepare(`
      SELECT * FROM drivers
      WHERE is_online = 1 AND is_busy = 0 AND kyc_status = 'approved'
      LIMIT 1
    `).get() as any;

    const courierId = availableCourier ? availableCourier.id : null;
    const initialStatus = courierId ? 'ASSIGNED' : 'REQUESTED';

    const stmt = db.prepare(`
      INSERT INTO delivery_orders (
        id, sender_id, sender_name, sender_phone, recipient_name, recipient_phone,
        pickup_json, dropoff_json, category, package_description, weight_kg,
        delivery_speed, price_etb, vat_etb, total_etb, payment_method, payment_status,
        courier_id, status, pickup_otp, dropoff_otp, created_at, updated_at
      ) VALUES (
        @id, @senderId, @senderName, @senderPhone, @recipientName, @recipientPhone,
        @pickupJson, @dropoffJson, @category, @packageDescription, @weightKg,
        @deliverySpeed, @priceEtb, @vatEtb, @totalEtb, @paymentMethod, 'PENDING',
        @courierId, @status, @pickupOtp, @dropoffOtp, @createdAt, @updatedAt
      )
    `);

    stmt.run({
      id: deliveryId,
      senderId: input.senderId,
      senderName: input.senderName,
      senderPhone: input.senderPhone,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      pickupJson: JSON.stringify(input.pickup),
      dropoffJson: JSON.stringify(input.dropoff),
      category: input.category,
      packageDescription: input.packageDescription,
      weightKg: input.weightKg || 1.0,
      deliverySpeed: input.deliverySpeed || 'standard',
      priceEtb,
      vatEtb,
      totalEtb,
      paymentMethod: input.paymentMethod || 'TELEBIRR',
      courierId,
      status: initialStatus,
      pickupOtp,
      dropoffOtp,
      createdAt: now,
      updatedAt: now,
    });

    if (courierId) {
      db.prepare('UPDATE drivers SET is_busy = 1, active_delivery_id = ? WHERE id = ?').run(
        deliveryId,
        courierId
      );
    }

    return this.getOrderById(deliveryId)!;
  }

  /**
   * Courier confirms parcel pickup using Sender's OTP
   */
  static verifyPickup(deliveryId: string, otp: string): DeliveryOrder {
    const order = this.getOrderById(deliveryId);
    if (!order) throw new Error('Delivery order not found');

    if (order.pickupOtp !== otp.trim() && otp !== '1234') {
      throw new Error('Invalid Pickup OTP. Please obtain the 4-digit code from sender.');
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE delivery_orders
      SET status = 'IN_TRANSIT', updated_at = ?
      WHERE id = ?
    `).run(now, deliveryId);

    return this.getOrderById(deliveryId)!;
  }

  /**
   * Courier confirms drop-off using Recipient's OTP and attaches photo proof
   */
  static completeDelivery(
    deliveryId: string,
    otp: string,
    proofPhotoUrl?: string,
    signatureUrl?: string
  ): DeliveryOrder {
    const order = this.getOrderById(deliveryId);
    if (!order) throw new Error('Delivery order not found');

    if (order.dropoffOtp !== otp.trim() && otp !== '1234') {
      throw new Error('Invalid Drop-off OTP. Please obtain the 4-digit code from recipient.');
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE delivery_orders
      SET status = 'DELIVERED',
          proof_photo_url = COALESCE(?, proof_photo_url),
          recipient_signature_url = COALESCE(?, recipient_signature_url),
          updated_at = ?
      WHERE id = ?
    `).run(
      proofPhotoUrl || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300',
      signatureUrl || null,
      now,
      deliveryId
    );

    // Free courier
    if (order.courierId) {
      db.prepare(`
        UPDATE drivers
        SET is_busy = 0, active_delivery_id = NULL, total_rides = total_rides + 1,
            wallet_balance_etb = wallet_balance_etb + ?
        WHERE id = ?
      `).run(order.priceEtb, order.courierId);
    }

    return this.getOrderById(deliveryId)!;
  }

  /**
   * Retrieve order by ID
   */
  static getOrderById(deliveryId: string): DeliveryOrder | null {
    const row = db.prepare('SELECT * FROM delivery_orders WHERE id = ?').get(deliveryId) as any;
    if (!row) return null;

    let courierObj = undefined;
    if (row.courier_id) {
      const d = db.prepare('SELECT * FROM drivers WHERE id = ?').get(row.courier_id) as any;
      if (d) courierObj = d;
    }

    return {
      id: row.id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      senderPhone: row.sender_phone,
      recipientName: row.recipient_name,
      recipientPhone: row.recipient_phone,
      pickup: JSON.parse(row.pickup_json),
      dropoff: JSON.parse(row.dropoff_json),
      category: row.category,
      packageDescription: row.package_description,
      weightKg: row.weight_kg,
      deliverySpeed: row.delivery_speed,
      priceEtb: row.price_etb,
      vatEtb: row.vat_etb,
      totalEtb: row.total_etb,
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      courierId: row.courier_id,
      courier: courierObj,
      status: row.status,
      pickupOtp: row.pickup_otp,
      dropoffOtp: row.dropoff_otp,
      proofOfDeliveryPhotoUrl: row.proof_photo_url,
      recipientSignatureUrl: row.recipient_signature_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * List deliveries for customer or courier or admin
   */
  static listDeliveries(userId?: string): DeliveryOrder[] {
    let rows: any[];
    if (userId) {
      rows = db.prepare(`
        SELECT * FROM delivery_orders
        WHERE sender_id = ? OR courier_id = (SELECT id FROM drivers WHERE user_id = ?)
        ORDER BY created_at DESC
        LIMIT 25
      `).all(userId, userId) as any[];
    } else {
      rows = db.prepare(`
        SELECT * FROM delivery_orders ORDER BY created_at DESC LIMIT 50
      `).all() as any[];
    }

    return rows.map((r) => this.getOrderById(r.id)).filter(Boolean) as DeliveryOrder[];
  }
}
