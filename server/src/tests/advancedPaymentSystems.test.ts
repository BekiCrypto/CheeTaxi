import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { initDatabase, db } from '../db/database.js';
import { PaymentRoutingService } from '../services/paymentRoutingService.js';
import { DispatchService } from '../services/dispatchService.js';

describe('Advanced Payment Systems: Direct Driver Rails, Tax Routing, Driver Credit & Passenger Wallet', () => {
  beforeAll(() => {
    initDatabase();
    db.prepare("UPDATE driver_payment_rails SET primary_rail = 'TELEBIRR', telebirr_phone = '+251911223344', cbe_account_number = '1000192837465' WHERE driver_id = 'driver_ahmed_01'").run();
  });

  beforeEach(() => {
    db.prepare("UPDATE drivers SET is_busy = 0, is_online = 1, active_ride_id = NULL, subscription_status = 'active'").run();
  });

  // 1. Driver Payment Rails
  describe('Driver Preferred Payment Rails', () => {
    it('should retrieve seeded driver payment rails', () => {
      const rails = PaymentRoutingService.getDriverRails('driver_ahmed_01');
      expect(rails).toBeDefined();
      expect(rails?.driverId).toBe('driver_ahmed_01');
      expect(rails?.telebirrPhone).toBe('+251911223344');
      expect(rails?.primaryRail).toBe('TELEBIRR');
      expect(rails?.isVerified).toBe(true);
    });

    it('should update driver preferred rails with CBE and Bank details', () => {
      const updated = PaymentRoutingService.updateDriverRails('driver_ahmed_01', {
        cbeAccountNumber: '1000999888777',
        cbeAccountName: 'Ahmed M. Ali (Business)',
        primaryRail: 'CBE_BIRR',
      });

      expect(updated.cbeAccountNumber).toBe('1000999888777');
      expect(updated.primaryRail).toBe('CBE_BIRR');
      expect(updated.qrCodeData).toContain('1000999888777');

      // Re-fetch to ensure database persistence
      const fresh = PaymentRoutingService.getDriverRails('driver_ahmed_01');
      expect(fresh?.cbeAccountNumber).toBe('1000999888777');
    });
  });

  // 2. Tax Routing Configuration
  describe('Tax & Revenue Routing Configuration', () => {
    it('should retrieve current tax routing configuration defaulting to DRIVER mode', () => {
      const config = PaymentRoutingService.getTaxRoutingConfig();
      expect(config.vatRatePercent).toBe(15);
      expect(config.authorityAccountName).toBe('FDRE Ministry of Revenues');
      expect(config.authorityAccountNumber).toBe('ERCA-VAT-570-2025');
    });

    it('should allow admin to update tax routing mode to AUTHORITY or PLATFORM', () => {
      PaymentRoutingService.updateTaxRoutingConfig({
        taxRoutingMode: 'AUTHORITY',
        authorityAccountNumber: 'ERCA-DIRECT-TREASURY-01',
      });

      const updated = PaymentRoutingService.getTaxRoutingConfig();
      expect(updated.taxRoutingMode).toBe('AUTHORITY');
      expect(updated.authorityAccountNumber).toBe('ERCA-DIRECT-TREASURY-01');

      // Reset back to DRIVER mode for 0% commission operations
      PaymentRoutingService.updateTaxRoutingConfig({
        taxRoutingMode: 'DRIVER',
        authorityAccountNumber: 'ERCA-VAT-570-2025',
      });
    });
  });

  // 3. Dynamic Payment Routing (0% Subscribed Driver vs Corporate/Platform)
  describe('Direct-to-Driver Routing vs Platform Escrow', () => {
    it('should route customer payment directly to Driver rails for independent subscribed driver', () => {
      // Create ride with independent driver
      const ride = DispatchService.createRide({
        riderId: 'user_leila_01',
        riderName: 'Leila Haile',
        riderPhone: '+251911223344',
        pickup: { address: 'Bole Medhanialem', lat: 8.9950, lng: 38.7880 },
        destination: { address: 'Kazanchis UNECA', lat: 9.0180, lng: 38.7700 },
        vehicleCategory: 'sedan',
        paymentMethod: 'TELEBIRR',
      });

      expect(ride.id).toBeDefined();

      const order = PaymentRoutingService.createRoutedPaymentOrder({
        rideId: ride.id,
        payerPhone: '+251911000001',
        paymentMethod: 'TELEBIRR',
      });

      expect(order.routingDestination).toBe('DRIVER_DIRECT');
      expect(order.driverRails).toBeDefined();
      expect(order.receiverTitle).toBeDefined();
      expect(
        order.ussdPushCode.includes(order.driverRails?.cbeAccountNumber || '') ||
        order.ussdPushCode.includes(order.driverRails?.telebirrPhone.replace('+', '') || '')
      ).toBe(true);
      expect(order.taxRouting.destination).toBe('DRIVER');
      expect(order.vatAmountEtb).toBeGreaterThan(0);
    });

    it('should route payment to Platform rails for corporate billing rides', () => {
      const ride = DispatchService.createRide({
        riderId: 'user_leila_01',
        riderName: 'Leila Haile',
        riderPhone: '+251911223344',
        pickup: { address: 'Bole Medhanialem', lat: 8.9950, lng: 38.7880 },
        destination: { address: 'Kazanchis UNECA', lat: 9.0180, lng: 38.7700 },
        vehicleCategory: 'sedan',
        paymentMethod: 'CORPORATE_BILLING',
      });

      // Mark ride with corporate account
      db.prepare("UPDATE rides SET corporate_id = 'corp_ethio_telecom' WHERE id = ?").run(ride.id);

      const order = PaymentRoutingService.createRoutedPaymentOrder({
        rideId: ride.id,
        payerPhone: '+251911000001',
        paymentMethod: 'CORPORATE_BILLING',
      });

      expect(order.routingDestination).toBe('PLATFORM_ESCROW');
      expect(order.platformRails).toBeDefined();
      expect(order.platformRails?.merchantId).toBe('ETH-TB-99882');
      expect(order.receiverTitle).toBe('Chebelew Technologies Ethiopia PLC');
    });

    it('should confirm payment and create immutable Ethiopian tax compliance audit record', () => {
      const ride = DispatchService.createRide({
        riderId: 'user_leila_01',
        riderName: 'Leila Haile',
        riderPhone: '+251911223344',
        pickup: { address: 'Bole Medhanialem', lat: 8.9950, lng: 38.7880 },
        destination: { address: 'Meskel Square', lat: 9.0105, lng: 38.7615 },
        vehicleCategory: 'sedan',
        paymentMethod: 'TELEBIRR',
      });

      const order = PaymentRoutingService.createRoutedPaymentOrder({
        rideId: ride.id,
        payerPhone: '+251911000001',
        paymentMethod: 'TELEBIRR',
      });

      const result = PaymentRoutingService.confirmPayment({
        orderId: order.orderId,
        success: true,
      });

      expect(result.success).toBe(true);
      expect(result.auditRecord).toBeDefined();
      expect(result.auditRecord.complianceReference).toMatch(/^ET-TAX-2026-\d{6}$/);
      expect(result.auditRecord.status).toBe('SETTLED');
      expect(result.auditRecord.amountEtb).toBe(order.amountEtb);

      // Verify ride status is PAID
      const updatedRide = db.prepare('SELECT payment_status FROM rides WHERE id = ?').get(ride.id) as any;
      expect(updatedRide.payment_status).toBe('PAID');
    });
  });

  // 4. Driver Platform Credit & Cash Reconciliation
  describe('Driver Platform Credit & Cash Reconciliation', () => {
    it('should retrieve driver credit balance and reconciliation summary', () => {
      const credit = PaymentRoutingService.getDriverPlatformCredit('driver_ahmed_01');
      expect(credit.creditBalanceEtb).toBeGreaterThanOrEqual(0);

      const summary = PaymentRoutingService.getDriverReconciliationSummary('driver_ahmed_01');
      expect(summary.driverId).toBe('driver_ahmed_01');
      expect(summary.status).toBeDefined();
    });

    it('should allow driver to top up platform credit', () => {
      const initial = PaymentRoutingService.getDriverPlatformCredit('driver_ahmed_01');
      const topup = PaymentRoutingService.topupDriverPlatformCredit({
        driverId: 'driver_ahmed_01',
        amountEtb: 500.0,
        paymentMethod: 'TELEBIRR',
        paymentReference: 'TB_CR_TEST_01',
      });

      expect(topup.credit.creditBalanceEtb).toBe(initial.creditBalanceEtb + 500.0);
      expect(topup.transaction.type).toBe('TOPUP');
      expect(topup.transaction.amountEtb).toBe(500.0);
    });

    it('should reconcile cash trip against platform credits and keep ledger', () => {
      const initial = PaymentRoutingService.getDriverPlatformCredit('driver_ahmed_01');
      const recon = PaymentRoutingService.reconcileCashPayment({
        driverId: 'driver_ahmed_01',
        rideId: 'ride_test_cash_01',
        cashAmountEtb: 300.0,
      });

      expect(recon.transaction.type).toBe('CASH_RECONCILIATION');
      expect(recon.transaction.paymentReference).toContain('ride_test_cash_01');

      const txs = PaymentRoutingService.getDriverCreditTransactions('driver_ahmed_01');
      expect(txs.length).toBeGreaterThan(0);
      expect(txs[0].driverId).toBe('driver_ahmed_01');
    });
  });

  // 5. Passenger Wallet & International Card Top-up
  describe('Passenger Wallet & Multi-Rail Top-up', () => {
    it('should retrieve passenger wallet balance and history', () => {
      const wallet = PaymentRoutingService.getPassengerWallet('user_leila_01');
      expect(wallet.userId).toBe('user_leila_01');
      expect(wallet.currency).toBe('ETB');
      expect(wallet.balanceEtb).toBeGreaterThanOrEqual(0);
    });

    it('should top up passenger wallet via International Card with USD exchange rate', () => {
      const initial = PaymentRoutingService.getPassengerWallet('user_leila_01');
      const topup = PaymentRoutingService.topupPassengerWallet({
        userId: 'user_leila_01',
        amountEtb: 1385.0, // $10 USD * 138.5 ETB/USD
        rail: 'INTERNATIONAL_CARD',
        cardDetails: {
          brand: 'MASTERCARD',
          last4: '8812',
          sourceCurrency: 'USD',
          sourceAmount: 10.0,
          exchangeRate: 138.5,
        },
      });

      expect(topup.wallet.balanceEtb).toBe(initial.balanceEtb + 1385.0);
      expect(topup.transaction.topupRail).toBe('INTERNATIONAL_CARD');
      expect(topup.transaction.cardDetails?.brand).toBe('MASTERCARD');
      expect(topup.transaction.cardDetails?.sourceAmount).toBe(10.0);
    });

    it('should top up passenger wallet via Apple Pay', () => {
      const initial = PaymentRoutingService.getPassengerWallet('user_leila_01');
      const topup = PaymentRoutingService.topupPassengerWallet({
        userId: 'user_leila_01',
        amountEtb: 500.0,
        rail: 'APPLE_PAY',
      });

      expect(topup.wallet.balanceEtb).toBe(initial.balanceEtb + 500.0);
      expect(topup.transaction.topupRail).toBe('APPLE_PAY');
    });

    it('should seamlessly pay for ride with Passenger Wallet balance', () => {
      // Ensure sufficient wallet balance
      PaymentRoutingService.topupPassengerWallet({
        userId: 'user_leila_01',
        amountEtb: 1000.0,
        rail: 'TELEBIRR',
      });

      const ride = DispatchService.createRide({
        riderId: 'user_leila_01',
        riderName: 'Leila Haile',
        riderPhone: '+251911223344',
        pickup: { address: 'Bole Medhanialem', lat: 8.9950, lng: 38.7880 },
        destination: { address: 'Bole Airport T2', lat: 8.9800, lng: 38.7990 },
        vehicleCategory: 'sedan',
        paymentMethod: 'TELEBIRR',
      });

      const walletBefore = PaymentRoutingService.getPassengerWallet('user_leila_01');
      const payResult = PaymentRoutingService.payWithPassengerWallet({
        userId: 'user_leila_01',
        rideId: ride.id,
        amountEtb: ride.fare.totalFare,
      });

      expect(payResult.success).toBe(true);
      expect(payResult.wallet.balanceEtb).toBe(walletBefore.balanceEtb - ride.fare.totalFare);

      // Verify ride updated
      const updatedRide = db.prepare('SELECT payment_method, payment_status FROM rides WHERE id = ?').get(ride.id) as any;
      expect(updatedRide.payment_method).toBe('WALLET');
      expect(updatedRide.payment_status).toBe('PAID');
    });
  });
});
