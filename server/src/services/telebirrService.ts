import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { TelebirrOrder } from '../../../shared/types.js';

export interface CreateTelebirrOrderInput {
  rideId: string;
  amountEtb: number;
  payerPhone: string;
  subject?: string;
}

export class TelebirrService {
  private static merchantId = 'ETH-TB-99882';
  private static merchantName = 'Chebelew Technologies Ethiopia PLC';

  /**
   * Initializes a digital payment transaction compliant with Ethio Telecom Telebirr H5/SDK specification.
   */
  static createOrder(input: CreateTelebirrOrderInput): TelebirrOrder {
    const orderId = `TB_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const outTradeNo = `CHB_${uuidv4().substring(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();
    const subject = input.subject || `Chebelew Taxi Trip Payment (${input.rideId})`;

    // Generate simulated USSD push snippet for Telebirr user
    const ussdPushCode = `*127*4*${this.merchantId}*${input.amountEtb.toFixed(2)}#`;

    // Dynamic QR string payload representing the Telebirr payment string
    const qrPayload = JSON.stringify({
      merchantId: this.merchantId,
      merchantName: this.merchantName,
      outTradeNo,
      orderId,
      amount: input.amountEtb,
      currency: 'ETB',
      timestamp: now,
    });

    const h5PaymentUrl = `/telebirr-gateway/checkout?orderId=${orderId}&tradeNo=${outTradeNo}&amount=${input.amountEtb}`;

    const stmt = db.prepare(`
      INSERT INTO telebirr_orders (
        order_id, ride_id, amount_etb, payer_phone, receiver_title, subject,
        status, out_trade_no, ussd_push_code, qr_payload, h5_payment_url, created_at
      ) VALUES (
        @orderId, @rideId, @amountEtb, @payerPhone, @receiverTitle, @subject,
        'PENDING', @outTradeNo, @ussdPushCode, @qrPayload, @h5PaymentUrl, @createdAt
      )
    `);

    stmt.run({
      orderId,
      rideId: input.rideId,
      amountEtb: input.amountEtb,
      payerPhone: input.payerPhone,
      receiverTitle: this.merchantName,
      subject,
      outTradeNo,
      ussdPushCode,
      qrPayload,
      h5PaymentUrl,
      createdAt: now,
    });

    return {
      orderId,
      rideId: input.rideId,
      amountEtb: input.amountEtb,
      payerPhone: input.payerPhone,
      receiverTitle: this.merchantName,
      subject,
      status: 'PENDING',
      outTradeNo,
      ussdPushCode,
      qrPayload,
      h5PaymentUrl,
      createdAt: now,
    };
  }

  /**
   * Simulates passenger confirming payment via Telebirr PIN / App / USSD
   */
  static processPayment(orderId: string, success: boolean = true): TelebirrOrder {
    const order = db.prepare('SELECT * FROM telebirr_orders WHERE order_id = ?').get(orderId) as any;
    if (!order) {
      throw new Error(`Telebirr order ${orderId} not found`);
    }

    const now = new Date().toISOString();
    const status = success ? 'SUCCESS' : 'FAILED';
    const transactionNo = success ? `TB${new Date().getFullYear()}${Date.now().toString().slice(-8)}` : undefined;

    db.prepare(`
      UPDATE telebirr_orders
      SET status = ?, transaction_no = ?, completed_at = ?
      WHERE order_id = ?
    `).run(status, transactionNo, now, orderId);

    // If successful, update the ride's payment status
    if (success) {
      db.prepare(`
        UPDATE rides
        SET payment_status = 'PAID', telebirr_order_id = ?, telebirr_tx_no = ?, updated_at = ?
        WHERE id = ?
      `).run(orderId, transactionNo, now, order.ride_id);

      // Settle driver wallet
      const ride = db.prepare('SELECT fare_json, driver_id FROM rides WHERE id = ?').get(order.ride_id) as any;
      if (ride && ride.driver_id) {
        const fare = JSON.parse(ride.fare_json);
        db.prepare(`
          UPDATE drivers
          SET wallet_balance_etb = wallet_balance_etb + ?
          WHERE id = ?
        `).run(fare.driverNetPayout, ride.driver_id);
      }
    }

    return {
      orderId: order.order_id,
      rideId: order.ride_id,
      amountEtb: order.amount_etb,
      payerPhone: order.payer_phone,
      receiverTitle: order.receiver_title,
      subject: order.subject,
      status: status as any,
      outTradeNo: order.out_trade_no,
      transactionNo,
      ussdPushCode: order.ussd_push_code,
      qrPayload: order.qr_payload,
      h5PaymentUrl: order.h5_payment_url,
      createdAt: order.created_at,
      completedAt: now,
    };
  }

  /**
   * Driver wallet payout to Telebirr mobile number
   */
  static requestDriverPayout(driverId: string, amountEtb: number): { success: boolean; message: string; newBalance: number } {
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driverId) as any;
    if (!driver) {
      throw new Error('Driver not found');
    }

    if (driver.wallet_balance_etb < amountEtb) {
      throw new Error('Insufficient wallet balance for withdrawal');
    }

    const newBalance = Number((driver.wallet_balance_etb - amountEtb).toFixed(2));
    db.prepare('UPDATE drivers SET wallet_balance_etb = ? WHERE id = ?').run(newBalance, driverId);

    return {
      success: true,
      message: `Successfully transferred ${amountEtb.toFixed(2)} ETB to Telebirr account (${driver.phone})`,
      newBalance,
    };
  }
}
