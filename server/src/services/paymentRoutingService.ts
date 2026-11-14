import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import {
  DriverPaymentRails,
  TaxRoutingConfig,
  TaxRoutingMode,
  PaymentAuditRecord,
  PaymentRoutingDestination,
  DriverPlatformCredit,
  DriverCreditTransaction,
  DriverCashReconciliationSummary,
  PassengerWallet,
  PassengerWalletTransaction,
  PassengerTopupRail,
  PaymentMethod,
} from '../../../shared/types.js';

export class PaymentRoutingService {
  /**
   * Retrieves a driver's configured payout rails
   */
  static getDriverRails(driverId: string): DriverPaymentRails | null {
    const row = db.prepare('SELECT * FROM driver_payment_rails WHERE driver_id = ?').get(driverId) as any;
    if (!row) return null;

    return {
      driverId: row.driver_id,
      telebirrPhone: row.telebirr_phone,
      telebirrAccountName: row.telebirr_account_name || undefined,
      cbeAccountNumber: row.cbe_account_number,
      cbeAccountName: row.cbe_account_name || undefined,
      bankName: row.bank_name,
      bankAccountNumber: row.bank_account_number || '',
      bankAccountName: row.bank_account_name || undefined,
      primaryRail: row.primary_rail,
      qrCodeData: row.qr_code_data || undefined,
      isVerified: Boolean(row.is_verified),
      updatedAt: row.updated_at,
    };
  }

  /**
   * Updates or registers a driver's payout rails
   */
  static updateDriverRails(driverId: string, rails: Partial<DriverPaymentRails>): DriverPaymentRails {
    const now = new Date().toISOString();
    const existing = this.getDriverRails(driverId);

    const telebirrPhone = rails.telebirrPhone ?? existing?.telebirrPhone ?? '';
    const telebirrAccountName = rails.telebirrAccountName ?? existing?.telebirrAccountName ?? '';
    const cbeAccountNumber = rails.cbeAccountNumber ?? existing?.cbeAccountNumber ?? '';
    const cbeAccountName = rails.cbeAccountName ?? existing?.cbeAccountName ?? '';
    const bankName = rails.bankName ?? existing?.bankName ?? 'Commercial Bank of Ethiopia';
    const bankAccountNumber = rails.bankAccountNumber ?? existing?.bankAccountNumber ?? cbeAccountNumber;
    const bankAccountName = rails.bankAccountName ?? existing?.bankAccountName ?? cbeAccountName;
    const primaryRail = rails.primaryRail ?? existing?.primaryRail ?? 'TELEBIRR';
    const qrCodeData = JSON.stringify({
      rail: primaryRail,
      identifier: primaryRail === 'TELEBIRR' ? telebirrPhone : primaryRail === 'CBE_BIRR' ? cbeAccountNumber : bankAccountNumber,
      name: primaryRail === 'TELEBIRR' ? telebirrAccountName : cbeAccountName,
      timestamp: now,
    });

    db.prepare(`
      INSERT INTO driver_payment_rails (
        driver_id, telebirr_phone, telebirr_account_name, cbe_account_number, cbe_account_name,
        bank_name, bank_account_number, bank_account_name, primary_rail, qr_code_data, is_verified, updated_at
      ) VALUES (
        @driverId, @telebirrPhone, @telebirrAccountName, @cbeAccountNumber, @cbeAccountName,
        @bankName, @bankAccountNumber, @bankAccountName, @primaryRail, @qrCodeData, 1, @now
      )
      ON CONFLICT(driver_id) DO UPDATE SET
        telebirr_phone = excluded.telebirr_phone,
        telebirr_account_name = excluded.telebirr_account_name,
        cbe_account_number = excluded.cbe_account_number,
        cbe_account_name = excluded.cbe_account_name,
        bank_name = excluded.bank_name,
        bank_account_number = excluded.bank_account_number,
        bank_account_name = excluded.bank_account_name,
        primary_rail = excluded.primary_rail,
        qr_code_data = excluded.qr_code_data,
        updated_at = excluded.updated_at
    `).run({
      driverId,
      telebirrPhone,
      telebirrAccountName,
      cbeAccountNumber,
      cbeAccountName,
      bankName,
      bankAccountNumber,
      bankAccountName,
      primaryRail,
      qrCodeData,
      now,
    });

    return this.getDriverRails(driverId)!;
  }

  /**
   * Retrieves active Tax & Revenue Routing Configuration
   */
  static getTaxRoutingConfig(): TaxRoutingConfig {
    const getSetting = (key: string, fallback: string) => {
      const row = db.prepare('SELECT value FROM system_settings WHERE key = ?').get(key) as any;
      return row ? row.value : fallback;
    };

    return {
      taxRoutingMode: getSetting('tax_routing_mode', 'DRIVER') as TaxRoutingMode,
      vatRatePercent: parseFloat(getSetting('vat_rate', '0.15')) * 100,
      authorityAccountName: getSetting('tax_authority_name', 'FDRE Ministry of Revenues'),
      authorityAccountNumber: getSetting('tax_authority_account', 'ERCA-VAT-570-2025'),
      authorityBank: getSetting('tax_authority_bank', 'National Bank of Ethiopia'),
      platformTaxEscrowBalanceEtb: parseFloat(getSetting('platform_tax_escrow_balance', '0.0')),
      platformTelebirrMerchantId: getSetting('platform_telebirr_merchant_id', 'ETH-TB-99882'),
      platformTelebirrMerchantName: getSetting('platform_telebirr_merchant_name', 'Chebelew Technologies Ethiopia PLC'),
      platformCbeAccount: getSetting('platform_cbe_account', '1000987654321'),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Updates Tax Routing Configuration (Admin Only)
   */
  static updateTaxRoutingConfig(config: Partial<TaxRoutingConfig>): TaxRoutingConfig {
    const now = new Date().toISOString();
    const updateSetting = (key: string, value: string) => {
      db.prepare(`
        INSERT INTO system_settings (key, value, category, description, updated_at)
        VALUES (?, ?, 'taxation', 'Updated via Admin Tax Console', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).run(key, value, now);
    };

    if (config.taxRoutingMode) updateSetting('tax_routing_mode', config.taxRoutingMode);
    if (config.authorityAccountName) updateSetting('tax_authority_name', config.authorityAccountName);
    if (config.authorityAccountNumber) updateSetting('tax_authority_account', config.authorityAccountNumber);
    if (config.authorityBank) updateSetting('tax_authority_bank', config.authorityBank);
    if (config.platformTelebirrMerchantId) updateSetting('platform_telebirr_merchant_id', config.platformTelebirrMerchantId);
    if (config.platformCbeAccount) updateSetting('platform_cbe_account', config.platformCbeAccount);

    return this.getTaxRoutingConfig();
  }

  /**
   * Dynamic payment routing engine:
   * Checks subscription status and commission model:
   * - 0% Commission Subscribed Driver -> Routes directly to Driver's Telebirr/CBE/Bank rails
   * - Corporate / Platform Eligible -> Routes to Platform configured merchant rails
   */
  static createRoutedPaymentOrder(input: {
    rideId: string;
    payerPhone: string;
    paymentMethod: PaymentMethod;
    amountEtb?: number;
  }) {
    const ride = db.prepare('SELECT * FROM rides WHERE id = ?').get(input.rideId) as any;
    if (!ride) {
      throw new Error(`Ride ${input.rideId} not found`);
    }

    const fare = JSON.parse(ride.fare_json || '{}');
    const totalAmount = input.amountEtb || fare.totalFare || 0;
    const fareSubtotal = fare.subtotal || totalAmount / 1.15;
    const vatAmount = fare.vatAmount || (totalAmount - fareSubtotal);

    const taxConfig = this.getTaxRoutingConfig();
    const driver = ride.driver_id
      ? (db.prepare('SELECT * FROM drivers WHERE id = ?').get(ride.driver_id) as any)
      : null;

    const isCorporate = Boolean(ride.corporate_id) || input.paymentMethod === 'CORPORATE_BILLING';
    const isIndependentSubscribedDriver = driver && driver.subscription_status === 'active' && !isCorporate;

    const destination: PaymentRoutingDestination = isIndependentSubscribedDriver
      ? 'DRIVER_DIRECT'
      : 'PLATFORM_ESCROW';

    const driverRails = driver ? this.getDriverRails(driver.id) : null;
    const orderId = `TB_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const outTradeNo = `CHB_${uuidv4().substring(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();

    let receiverTitle = '';
    let accountIdentifier = '';
    let ussdPushCode = '';
    let qrPayload = '';

    if (destination === 'DRIVER_DIRECT' && driverRails) {
      receiverTitle = driverRails.telebirrAccountName || driver.full_name;
      if (input.paymentMethod === 'CBE_BIRR' || driverRails.primaryRail === 'CBE_BIRR') {
        accountIdentifier = driverRails.cbeAccountNumber;
        ussdPushCode = `*889*1*${driverRails.cbeAccountNumber}*${totalAmount.toFixed(2)}#`;
      } else if (input.paymentMethod === 'BANK_TRANSFER' || driverRails.primaryRail === 'BANK_TRANSFER') {
        accountIdentifier = `${driverRails.bankName}: ${driverRails.bankAccountNumber}`;
        ussdPushCode = `Transfer to ${driverRails.bankName} ${driverRails.bankAccountNumber}`;
      } else {
        // Telebirr
        accountIdentifier = driverRails.telebirrPhone;
        ussdPushCode = `*127*1*${driverRails.telebirrPhone.replace('+', '')}*${totalAmount.toFixed(2)}#`;
      }

      qrPayload = JSON.stringify({
        destination: 'DRIVER_DIRECT',
        driverId: driver.id,
        driverName: driver.full_name,
        rail: driverRails.primaryRail,
        account: accountIdentifier,
        orderId,
        outTradeNo,
        amount: totalAmount,
        currency: 'ETB',
        vatIncluded: vatAmount,
        taxMode: taxConfig.taxRoutingMode,
        timestamp: now,
      });
    } else {
      // Platform Escrow
      receiverTitle = taxConfig.platformTelebirrMerchantName;
      accountIdentifier = taxConfig.platformTelebirrMerchantId;
      ussdPushCode = `*127*4*${taxConfig.platformTelebirrMerchantId}*${totalAmount.toFixed(2)}#`;
      qrPayload = JSON.stringify({
        destination: 'PLATFORM_ESCROW',
        merchantId: taxConfig.platformTelebirrMerchantId,
        merchantName: taxConfig.platformTelebirrMerchantName,
        orderId,
        outTradeNo,
        amount: totalAmount,
        currency: 'ETB',
        timestamp: now,
      });
    }

    const h5PaymentUrl = `/telebirr-gateway/checkout?orderId=${orderId}&tradeNo=${outTradeNo}&amount=${totalAmount}&dest=${destination}`;

    // Insert into telebirr_orders
    db.prepare(`
      INSERT INTO telebirr_orders (
        order_id, ride_id, amount_etb, payer_phone, receiver_title, subject,
        status, out_trade_no, ussd_push_code, qr_payload, h5_payment_url, created_at
      ) VALUES (
        @orderId, @rideId, @amountEtb, @payerPhone, @receiverTitle, @subject,
        'PENDING', @outTradeNo, @ussdPushCode, @qrPayload, @h5PaymentUrl, @createdAt
      )
    `).run({
      orderId,
      rideId: input.rideId,
      amountEtb: totalAmount,
      payerPhone: input.payerPhone,
      receiverTitle,
      subject: `Chebelew Ride Payment [${destination}] - ${input.rideId}`,
      outTradeNo,
      ussdPushCode,
      qrPayload,
      h5PaymentUrl,
      createdAt: now,
    });

    return {
      orderId,
      rideId: input.rideId,
      amountEtb: totalAmount,
      fareSubtotalEtb: fareSubtotal,
      vatAmountEtb: vatAmount,
      payerPhone: input.payerPhone,
      receiverTitle,
      routingDestination: destination,
      driverRails: destination === 'DRIVER_DIRECT' ? driverRails : null,
      platformRails: destination === 'PLATFORM_ESCROW' ? {
        merchantId: taxConfig.platformTelebirrMerchantId,
        merchantName: taxConfig.platformTelebirrMerchantName,
        cbeAccount: taxConfig.platformCbeAccount,
      } : null,
      taxRouting: {
        destination: taxConfig.taxRoutingMode,
        vatRatePercent: taxConfig.vatRatePercent,
        vatAmountEtb: vatAmount,
        recipientAccount: taxConfig.taxRoutingMode === 'AUTHORITY'
          ? taxConfig.authorityAccountNumber
          : taxConfig.taxRoutingMode === 'PLATFORM'
          ? taxConfig.platformCbeAccount
          : (driverRails?.telebirrPhone || 'DRIVER_RETAINED'),
      },
      outTradeNo,
      ussdPushCode,
      qrPayload,
      h5PaymentUrl,
      status: 'PENDING',
      createdAt: now,
    };
  }

  /**
   * Confirms payment and produces immutable Ethiopian tax & compliance audit record
   */
  static confirmPayment(input: {
    orderId: string;
    success?: boolean;
    transactionNo?: string;
  }): { success: boolean; auditRecord: PaymentAuditRecord } {
    const success = input.success !== false;
    const now = new Date().toISOString();

    const order = db.prepare('SELECT * FROM telebirr_orders WHERE order_id = ?').get(input.orderId) as any;
    if (!order) {
      throw new Error(`Payment order ${input.orderId} not found`);
    }

    const txNo = input.transactionNo || `TX_${new Date().getFullYear()}_${Date.now().toString().slice(-8)}`;

    db.prepare(`
      UPDATE telebirr_orders
      SET status = ?, transaction_no = ?, completed_at = ?
      WHERE order_id = ?
    `).run(success ? 'SUCCESS' : 'FAILED', txNo, now, input.orderId);

    if (!success) {
      throw new Error('Payment transaction authorization failed');
    }

    // Update Ride
    const ride = db.prepare('SELECT * FROM rides WHERE id = ?').get(order.ride_id) as any;
    if (ride) {
      db.prepare(`
        UPDATE rides
        SET payment_status = 'PAID', telebirr_order_id = ?, telebirr_tx_no = ?, updated_at = ?
        WHERE id = ?
      `).run(input.orderId, txNo, now, ride.id);
    }

    const fare = ride ? JSON.parse(ride.fare_json || '{}') : {};
    const taxConfig = this.getTaxRoutingConfig();
    const driver = ride && ride.driver_id ? (db.prepare('SELECT * FROM drivers WHERE id = ?').get(ride.driver_id) as any) : null;
    const driverRails = driver ? this.getDriverRails(driver.id) : null;

    const isCorporate = Boolean(ride?.corporate_id) || ride?.payment_method === 'CORPORATE_BILLING';
    const routingDestination: PaymentRoutingDestination = (driver && driver.subscription_status === 'active' && !isCorporate)
      ? 'DRIVER_DIRECT'
      : 'PLATFORM_ESCROW';

    const vatAmount = fare.vatAmount || (order.amount_etb * 0.15 / 1.15);
    const subtotal = order.amount_etb - vatAmount;

    let taxRecipientAccount = '';
    if (taxConfig.taxRoutingMode === 'AUTHORITY') {
      taxRecipientAccount = `${taxConfig.authorityAccountName} (${taxConfig.authorityAccountNumber})`;
    } else if (taxConfig.taxRoutingMode === 'PLATFORM') {
      taxRecipientAccount = `Platform Escrow (${taxConfig.platformCbeAccount})`;
      // Credit platform tax escrow
      db.prepare(`
        INSERT INTO system_settings (key, value, category, description, updated_at)
        VALUES ('platform_tax_escrow_balance', ?, 'taxation', 'Accumulated platform tax escrow', ?)
        ON CONFLICT(key) DO UPDATE SET value = value + excluded.value, updated_at = excluded.updated_at
      `).run(vatAmount.toString(), now);
    } else {
      // Driver direct
      taxRecipientAccount = driverRails ? `${driverRails.primaryRail}: ${driverRails.telebirrPhone}` : 'Driver Tax Filer';
    }

    // Credit driver earnings if driver direct
    if (driver && routingDestination === 'DRIVER_DIRECT') {
      db.prepare(`
        UPDATE drivers
        SET wallet_balance_etb = wallet_balance_etb + ?
        WHERE id = ?
      `).run(order.amount_etb, driver.id);
    }

    // Create Compliance Audit Record
    const complianceReference = `ET-TAX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const auditId = `audit_${uuidv4().substring(0, 8)}`;

    const auditStmt = db.prepare(`
      INSERT INTO payment_audit_records (
        id, order_id, ride_id, rider_id, driver_id, amount_etb, fare_subtotal_etb,
        vat_amount_etb, payment_method, routing_destination, driver_rail_json,
        platform_rail_json, tax_routing_destination, tax_amount_etb,
        tax_recipient_account, compliance_reference, status, timestamp
      ) VALUES (
        @id, @order_id, @ride_id, @rider_id, @driver_id, @amount_etb, @fare_subtotal_etb,
        @vat_amount_etb, @payment_method, @routing_destination, @driver_rail_json,
        @platform_rail_json, @tax_routing_destination, @tax_amount_etb,
        @tax_recipient_account, @compliance_reference, 'SETTLED', @timestamp
      )
    `);

    const auditRecord: PaymentAuditRecord = {
      id: auditId,
      orderId: input.orderId,
      rideId: ride?.id,
      riderId: ride?.rider_id || 'unknown',
      driverId: driver?.id,
      amountEtb: order.amount_etb,
      fareSubtotalEtb: subtotal,
      vatAmountEtb: vatAmount,
      paymentMethod: ride?.payment_method || 'TELEBIRR',
      routingDestination,
      driverRailUsed: driverRails ? {
        railType: driverRails.primaryRail,
        accountIdentifier: driverRails.primaryRail === 'TELEBIRR' ? driverRails.telebirrPhone : driverRails.cbeAccountNumber,
        accountName: driverRails.primaryRail === 'TELEBIRR' ? (driverRails.telebirrAccountName || driver.full_name) : (driverRails.cbeAccountName || driver.full_name),
      } : undefined,
      platformRailUsed: routingDestination === 'PLATFORM_ESCROW' ? {
        merchantId: taxConfig.platformTelebirrMerchantId,
        merchantName: taxConfig.platformTelebirrMerchantName,
      } : undefined,
      taxRoutingDestination: taxConfig.taxRoutingMode,
      taxAmountEtb: vatAmount,
      taxRecipientAccount,
      complianceReference,
      status: 'SETTLED',
      timestamp: now,
    };

    auditStmt.run({
      id: auditId,
      order_id: input.orderId,
      ride_id: ride?.id || null,
      rider_id: ride?.rider_id || 'unknown',
      driver_id: driver?.id || null,
      amount_etb: order.amount_etb,
      fare_subtotal_etb: subtotal,
      vat_amount_etb: vatAmount,
      payment_method: ride?.payment_method || 'TELEBIRR',
      routing_destination: routingDestination,
      driver_rail_json: driverRails ? JSON.stringify(driverRails) : null,
      platform_rail_json: JSON.stringify({
        merchantId: taxConfig.platformTelebirrMerchantId,
        merchantName: taxConfig.platformTelebirrMerchantName,
        cbeAccount: taxConfig.platformCbeAccount,
      }),
      tax_routing_destination: taxConfig.taxRoutingMode,
      tax_amount_etb: vatAmount,
      tax_recipient_account: taxRecipientAccount,
      compliance_reference: complianceReference,
      timestamp: now,
    });

    return { success: true, auditRecord };
  }

  // --------------------------------------------------------------------------
  // Driver Platform Credit & Cash Reconciliation Subsystem
  // --------------------------------------------------------------------------

  /**
   * Retrieves driver platform credit balance
   */
  static getDriverPlatformCredit(driverId: string): DriverPlatformCredit {
    let row = db.prepare('SELECT * FROM driver_platform_credits WHERE driver_id = ?').get(driverId) as any;
    if (!row) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO driver_platform_credits (driver_id, credit_balance_etb, total_topups_etb, total_deductions_etb, last_topup_at, updated_at)
        VALUES (?, 0.0, 0.0, 0.0, null, ?)
      `).run(driverId, now);
      row = { driver_id: driverId, credit_balance_etb: 0.0, total_topups_etb: 0.0, total_deductions_etb: 0.0, last_topup_at: null, updated_at: now };
    }

    return {
      driverId: row.driver_id,
      creditBalanceEtb: row.credit_balance_etb,
      totalTopupsEtb: row.total_topups_etb,
      totalDeductionsEtb: row.total_deductions_etb,
      lastTopupAt: row.last_topup_at || undefined,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Top up driver platform credits
   */
  static topupDriverPlatformCredit(input: {
    driverId: string;
    amountEtb: number;
    paymentMethod: PaymentMethod;
    paymentReference?: string;
  }): { credit: DriverPlatformCredit; transaction: DriverCreditTransaction } {
    const now = new Date().toISOString();
    const current = this.getDriverPlatformCredit(input.driverId);
    const newBalance = current.creditBalanceEtb + input.amountEtb;
    const ref = input.paymentReference || `CR_TOPUP_${Date.now().toString().slice(-6)}`;

    db.prepare(`
      UPDATE driver_platform_credits
      SET credit_balance_etb = credit_balance_etb + ?,
          total_topups_etb = total_topups_etb + ?,
          last_topup_at = ?,
          updated_at = ?
      WHERE driver_id = ?
    `).run(input.amountEtb, input.amountEtb, now, now, input.driverId);

    const txId = `ctx_${uuidv4().substring(0, 8)}`;
    const tx: DriverCreditTransaction = {
      id: txId,
      driverId: input.driverId,
      type: 'TOPUP',
      amountEtb: input.amountEtb,
      balanceAfterEtb: newBalance,
      paymentMethod: input.paymentMethod,
      paymentReference: ref,
      description: `Driver credit balance top-up via ${input.paymentMethod}`,
      createdAt: now,
    };

    db.prepare(`
      INSERT INTO driver_credit_transactions (
        id, driver_id, type, amount_etb, balance_after_etb, payment_method, payment_reference, description, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(tx.id, tx.driverId, tx.type, tx.amountEtb, tx.balanceAfterEtb, tx.paymentMethod, tx.paymentReference, tx.description, tx.createdAt);

    return { credit: this.getDriverPlatformCredit(input.driverId), transaction: tx };
  }

  /**
   * Reconciles cash trip against driver platform credit
   */
  static reconcileCashPayment(input: {
    driverId: string;
    rideId: string;
    cashAmountEtb: number;
  }): { credit: DriverPlatformCredit; transaction: DriverCreditTransaction } {
    const now = new Date().toISOString();
    const current = this.getDriverPlatformCredit(input.driverId);

    // Platform fee or tax deduction if configured
    const taxConfig = this.getTaxRoutingConfig();
    const vatRate = taxConfig.vatRatePercent / 100;
    const vatAmount = (input.cashAmountEtb * vatRate) / (1 + vatRate);
    
    // In 0% commission mode with DRIVER tax mode, reconciliation deduction is 0 unless platform collects tax
    const deduction = taxConfig.taxRoutingMode === 'PLATFORM' || taxConfig.taxRoutingMode === 'AUTHORITY'
      ? vatAmount
      : 0;

    const newBalance = current.creditBalanceEtb - deduction;

    if (deduction > 0) {
      db.prepare(`
        UPDATE driver_platform_credits
        SET credit_balance_etb = credit_balance_etb - ?,
            total_deductions_etb = total_deductions_etb + ?,
            updated_at = ?
        WHERE driver_id = ?
      `).run(deduction, deduction, now, input.driverId);
    }

    const txId = `ctx_${uuidv4().substring(0, 8)}`;
    const tx: DriverCreditTransaction = {
      id: txId,
      driverId: input.driverId,
      type: 'CASH_RECONCILIATION',
      amountEtb: -deduction,
      balanceAfterEtb: newBalance,
      paymentMethod: 'CASH',
      paymentReference: `RECON_${input.rideId}`,
      description: `Cash trip reconciliation for ${input.rideId} (Collected: ${input.cashAmountEtb.toFixed(2)} ETB, Deducted: ${deduction.toFixed(2)} ETB)`,
      createdAt: now,
    };

    db.prepare(`
      INSERT INTO driver_credit_transactions (
        id, driver_id, type, amount_etb, balance_after_etb, payment_method, payment_reference, description, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(tx.id, tx.driverId, tx.type, tx.amountEtb, tx.balanceAfterEtb, tx.paymentMethod, tx.paymentReference, tx.description, tx.createdAt);

    return { credit: this.getDriverPlatformCredit(input.driverId), transaction: tx };
  }

  static getDriverCreditTransactions(driverId: string): DriverCreditTransaction[] {
    const rows = db.prepare(`
      SELECT * FROM driver_credit_transactions
      WHERE driver_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(driverId) as any[];

    return rows.map((r) => ({
      id: r.id,
      driverId: r.driver_id,
      type: r.type,
      amountEtb: r.amount_etb,
      balanceAfterEtb: r.balance_after_etb,
      paymentMethod: r.payment_method,
      paymentReference: r.payment_reference,
      description: r.description,
      createdAt: r.created_at,
    }));
  }

  static getDriverReconciliationSummary(driverId: string): DriverCashReconciliationSummary {
    const credit = this.getDriverPlatformCredit(driverId);
    const cashRides = db.prepare(`
      SELECT SUM(json_extract(fare_json, '$.totalFare')) as total_cash
      FROM rides
      WHERE driver_id = ? AND payment_method = 'CASH' AND status = 'COMPLETED'
    `).get(driverId) as any;

    const totalCash = cashRides?.total_cash || 0;
    const threshold = 100.0;

    let status: 'IN_GOOD_STANDING' | 'LOW_CREDIT_ALERT' | 'TOPUP_REQUIRED' = 'IN_GOOD_STANDING';
    if (credit.creditBalanceEtb <= 0) {
      status = 'TOPUP_REQUIRED';
    } else if (credit.creditBalanceEtb < threshold) {
      status = 'LOW_CREDIT_ALERT';
    }

    return {
      driverId,
      totalCashCollectedEtb: totalCash,
      platformCreditsRemainingEtb: credit.creditBalanceEtb,
      pendingReconciliationEtb: credit.totalDeductionsEtb,
      status,
    };
  }

  // --------------------------------------------------------------------------
  // Passenger Wallet & Multi-Rail Top-up (Local & International Cards / POS)
  // --------------------------------------------------------------------------

  static getPassengerWallet(userId: string): PassengerWallet {
    let row = db.prepare('SELECT * FROM passenger_wallets WHERE user_id = ?').get(userId) as any;
    if (!row) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO passenger_wallets (user_id, balance_etb, currency, total_topped_up_etb, total_spent_etb, last_topup_at, updated_at)
        VALUES (?, 0.0, 'ETB', 0.0, 0.0, null, ?)
      `).run(userId, now);
      row = { user_id: userId, balance_etb: 0.0, currency: 'ETB', total_topped_up_etb: 0.0, total_spent_etb: 0.0, last_topup_at: null, updated_at: now };
    }

    return {
      userId: row.user_id,
      balanceEtb: row.balance_etb,
      currency: row.currency,
      totalToppedUpEtb: row.total_topped_up_etb,
      totalSpentEtb: row.total_spent_etb,
      lastTopupAt: row.last_topup_at || undefined,
      updatedAt: row.updated_at,
    };
  }

  static topupPassengerWallet(input: {
    userId: string;
    amountEtb: number;
    rail: PassengerTopupRail;
    cardDetails?: {
      brand: 'VISA' | 'MASTERCARD' | 'AMEX';
      last4: string;
      sourceCurrency?: string;
      sourceAmount?: number;
      exchangeRate?: number;
    };
    reference?: string;
  }): { wallet: PassengerWallet; transaction: PassengerWalletTransaction } {
    const now = new Date().toISOString();
    const current = this.getPassengerWallet(input.userId);
    const newBalance = current.balanceEtb + input.amountEtb;
    const ref = input.reference || `WAL_TOPUP_${Date.now().toString().slice(-6)}`;

    let description = `Wallet top-up via ${input.rail}`;
    if (input.rail === 'INTERNATIONAL_CARD' && input.cardDetails) {
      description = `International Card Top-up (${input.cardDetails.brand} *${input.cardDetails.last4}) - ${input.cardDetails.sourceAmount} ${input.cardDetails.sourceCurrency || 'USD'} @ ${input.cardDetails.exchangeRate || 138.5} ETB`;
    } else if (input.rail === 'APPLE_PAY') {
      description = `Apple Pay Biometric Wallet Top-up`;
    } else if (input.rail === 'POS_SWIPE') {
      description = `Point of Sale (POS) Card Swipe Top-up`;
    }

    db.prepare(`
      UPDATE passenger_wallets
      SET balance_etb = balance_etb + ?,
          total_topped_up_etb = total_topped_up_etb + ?,
          last_topup_at = ?,
          updated_at = ?
      WHERE user_id = ?
    `).run(input.amountEtb, input.amountEtb, now, now, input.userId);

    const txId = `wtx_${uuidv4().substring(0, 8)}`;
    const tx: PassengerWalletTransaction = {
      id: txId,
      userId: input.userId,
      type: 'TOPUP',
      amountEtb: input.amountEtb,
      balanceAfterEtb: newBalance,
      topupRail: input.rail,
      cardDetails: input.cardDetails,
      reference: ref,
      description,
      status: 'COMPLETED',
      createdAt: now,
    };

    db.prepare(`
      INSERT INTO passenger_wallet_transactions (
        id, user_id, type, amount_etb, balance_after_etb, topup_rail, card_details_json, reference, description, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tx.id,
      tx.userId,
      tx.type,
      tx.amountEtb,
      tx.balanceAfterEtb,
      tx.topupRail,
      tx.cardDetails ? JSON.stringify(tx.cardDetails) : null,
      tx.reference,
      tx.description,
      tx.status,
      tx.createdAt
    );

    return { wallet: this.getPassengerWallet(input.userId), transaction: tx };
  }

  static getPassengerWalletTransactions(userId: string): PassengerWalletTransaction[] {
    const rows = db.prepare(`
      SELECT * FROM passenger_wallet_transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(userId) as any[];

    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      amountEtb: r.amount_etb,
      balanceAfterEtb: r.balance_after_etb,
      topupRail: r.topup_rail,
      cardDetails: r.card_details_json ? JSON.parse(r.card_details_json) : undefined,
      reference: r.reference,
      description: r.description,
      status: r.status,
      createdAt: r.created_at,
    }));
  }

  static payWithPassengerWallet(input: {
    userId: string;
    rideId: string;
    amountEtb: number;
  }) {
    const wallet = this.getPassengerWallet(input.userId);
    if (wallet.balanceEtb < input.amountEtb) {
      throw new Error(`Insufficient wallet balance (${wallet.balanceEtb.toFixed(2)} ETB). Required: ${input.amountEtb.toFixed(2)} ETB.`);
    }

    const now = new Date().toISOString();
    const newBalance = wallet.balanceEtb - input.amountEtb;

    db.prepare(`
      UPDATE passenger_wallets
      SET balance_etb = balance_etb - ?,
          total_spent_etb = total_spent_etb + ?,
          updated_at = ?
      WHERE user_id = ?
    `).run(input.amountEtb, input.amountEtb, now, input.userId);

    const txId = `wtx_${uuidv4().substring(0, 8)}`;
    const tx: PassengerWalletTransaction = {
      id: txId,
      userId: input.userId,
      type: 'RIDE_PAYMENT',
      amountEtb: -input.amountEtb,
      balanceAfterEtb: newBalance,
      reference: `WAL_RIDE_${input.rideId}`,
      description: `Payment for Chebelew Ride ${input.rideId}`,
      status: 'COMPLETED',
      createdAt: now,
    };

    db.prepare(`
      INSERT INTO passenger_wallet_transactions (
        id, user_id, type, amount_etb, balance_after_etb, topup_rail, card_details_json, reference, description, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(tx.id, tx.userId, tx.type, tx.amountEtb, tx.balanceAfterEtb, 'WALLET', null, tx.reference, tx.description, tx.status, tx.createdAt);

    // Update ride to PAID
    db.prepare(`
      UPDATE rides
      SET payment_method = 'WALLET', payment_status = 'PAID', updated_at = ?
      WHERE id = ?
    `).run(now, input.rideId);

    // Credit driver
    const ride = db.prepare('SELECT driver_id, fare_json FROM rides WHERE id = ?').get(input.rideId) as any;
    if (ride && ride.driver_id) {
      const fare = JSON.parse(ride.fare_json || '{}');
      const payout = fare.driverNetPayout || input.amountEtb;
      db.prepare(`
        UPDATE drivers
        SET wallet_balance_etb = wallet_balance_etb + ?
        WHERE id = ?
      `).run(payout, ride.driver_id);
    }

    return {
      success: true,
      wallet: this.getPassengerWallet(input.userId),
      transaction: tx,
    };
  }

  static getAllPaymentAuditRecords(limit: number = 50): PaymentAuditRecord[] {
    const rows = db.prepare(`
      SELECT * FROM payment_audit_records
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(limit) as any[];

    return rows.map((r) => ({
      id: r.id,
      orderId: r.order_id,
      rideId: r.ride_id,
      riderId: r.rider_id,
      driverId: r.driver_id,
      amountEtb: r.amount_etb,
      fareSubtotalEtb: r.fare_subtotal_etb,
      vatAmountEtb: r.vat_amount_etb,
      paymentMethod: r.payment_method,
      routingDestination: r.routing_destination,
      driverRailUsed: r.driver_rail_json ? JSON.parse(r.driver_rail_json) : undefined,
      platformRailUsed: r.platform_rail_json ? JSON.parse(r.platform_rail_json) : undefined,
      taxRoutingDestination: r.tax_routing_destination,
      taxAmountEtb: r.tax_amount_etb,
      taxRecipientAccount: r.tax_recipient_account,
      complianceReference: r.compliance_reference,
      status: r.status,
      timestamp: r.timestamp,
    }));
  }
}
