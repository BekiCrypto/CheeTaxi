import { Router, Request, Response } from 'express';
import { PaymentRoutingService } from '../services/paymentRoutingService.js';
import { PaymentMethod, PassengerTopupRail } from '../../../shared/types.js';

export const paymentRouter = Router();

// ============================================================================
// Driver Preferred Payout Rails & Credit Topup Endpoints
// ============================================================================

/**
 * GET /api/drivers/:id/payment-rails
 * Get driver's payout rails (Telebirr, CBE, Bank)
 */
paymentRouter.get('/drivers/:id/payment-rails', (req: Request, res: Response) => {
  try {
    const rails = PaymentRoutingService.getDriverRails(req.params.id);
    if (!rails) {
      return res.status(404).json({ error: 'Driver payment rails not found' });
    }
    return res.json({ success: true, rails });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/drivers/:id/payment-rails
 * Update driver's payout rails
 */
paymentRouter.put('/drivers/:id/payment-rails', (req: Request, res: Response) => {
  try {
    const rails = PaymentRoutingService.updateDriverRails(req.params.id, req.body);
    return res.json({ success: true, rails });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/drivers/:id/credits
 * Get driver platform credit balance
 */
paymentRouter.get('/drivers/:id/credits', (req: Request, res: Response) => {
  try {
    const credit = PaymentRoutingService.getDriverPlatformCredit(req.params.id);
    const summary = PaymentRoutingService.getDriverReconciliationSummary(req.params.id);
    return res.json({ success: true, credit, summary });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/drivers/:id/credits/topup
 * Top up driver platform credit balance
 */
paymentRouter.post('/drivers/:id/credits/topup', (req: Request, res: Response) => {
  try {
    const { amountEtb, paymentMethod = 'TELEBIRR', paymentReference } = req.body;
    if (!amountEtb || amountEtb <= 0) {
      return res.status(400).json({ error: 'Invalid top-up amount' });
    }

    const result = PaymentRoutingService.topupDriverPlatformCredit({
      driverId: req.params.id,
      amountEtb: Number(amountEtb),
      paymentMethod: paymentMethod as PaymentMethod,
      paymentReference,
    });

    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/drivers/:id/credits/transactions
 * Get driver credit top-up and reconciliation history
 */
paymentRouter.get('/drivers/:id/credits/transactions', (req: Request, res: Response) => {
  try {
    const transactions = PaymentRoutingService.getDriverCreditTransactions(req.params.id);
    return res.json({ success: true, transactions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/drivers/:id/reconciliation
 * Cash vs Digital reconciliation summary
 */
paymentRouter.get('/drivers/:id/reconciliation', (req: Request, res: Response) => {
  try {
    const summary = PaymentRoutingService.getDriverReconciliationSummary(req.params.id);
    return res.json({ success: true, summary });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// Payment Order Routing Engine (Direct-to-Driver vs Platform Escrow)
// ============================================================================

/**
 * POST /api/payment/route-order
 * Routes payment to Driver's rails if 0% commission, or Platform if corporate/eligible
 */
paymentRouter.post('/route-order', (req: Request, res: Response) => {
  try {
    const { rideId, payerPhone, paymentMethod = 'TELEBIRR', amountEtb } = req.body;
    if (!rideId || !payerPhone) {
      return res.status(400).json({ error: 'rideId and payerPhone are required' });
    }

    const order = PaymentRoutingService.createRoutedPaymentOrder({
      rideId,
      payerPhone,
      paymentMethod: paymentMethod as PaymentMethod,
      amountEtb: amountEtb ? Number(amountEtb) : undefined,
    });

    return res.json({ success: true, order });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/payment/confirm
 * Settle payment order & generate Ethiopian tax compliance receipt
 */
paymentRouter.post('/confirm', (req: Request, res: Response) => {
  try {
    const { orderId, success = true, transactionNo } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const result = PaymentRoutingService.confirmPayment({
      orderId,
      success: Boolean(success),
      transactionNo,
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/payment/audit-logs
 * List tax and compliance payment audit records
 */
paymentRouter.get('/audit-logs', (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const records = PaymentRoutingService.getAllPaymentAuditRecords(limit);
    return res.json({ success: true, records });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// Tax Routing Configuration (Admin Only)
// ============================================================================

/**
 * GET /api/admin/tax-routing
 * Get current Tax routing mode (DRIVER | PLATFORM | AUTHORITY)
 */
paymentRouter.get('/admin/tax-routing', (_req: Request, res: Response) => {
  try {
    const config = PaymentRoutingService.getTaxRoutingConfig();
    return res.json({ success: true, config });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/admin/tax-routing
 * Update tax routing configuration
 */
paymentRouter.put('/admin/tax-routing', (req: Request, res: Response) => {
  try {
    const config = PaymentRoutingService.updateTaxRoutingConfig(req.body);
    return res.json({ success: true, config });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// Passenger Wallet & Multi-Rail Top-up (Local + International Cards / POS)
// ============================================================================

/**
 * GET /api/wallet/:userId
 * Get passenger wallet balance & topup metrics
 */
paymentRouter.get('/wallet/:userId', (req: Request, res: Response) => {
  try {
    const wallet = PaymentRoutingService.getPassengerWallet(req.params.userId);
    return res.json({ success: true, wallet });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/wallet/:userId/topup
 * Top up passenger wallet via Telebirr, CBE Birr, International Cards, Apple Pay, POS
 */
paymentRouter.post('/wallet/:userId/topup', (req: Request, res: Response) => {
  try {
    const { amountEtb, rail = 'TELEBIRR', cardDetails, reference } = req.body;
    if (!amountEtb || amountEtb <= 0) {
      return res.status(400).json({ error: 'Valid amountEtb is required' });
    }

    const result = PaymentRoutingService.topupPassengerWallet({
      userId: req.params.userId,
      amountEtb: Number(amountEtb),
      rail: rail as PassengerTopupRail,
      cardDetails,
      reference,
    });

    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/wallet/:userId/transactions
 * Passenger wallet transaction history
 */
paymentRouter.get('/wallet/:userId/transactions', (req: Request, res: Response) => {
  try {
    const transactions = PaymentRoutingService.getPassengerWalletTransactions(req.params.userId);
    return res.json({ success: true, transactions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/wallet/:userId/pay-ride
 * Instantly pay for ride using funded passenger wallet
 */
paymentRouter.post('/wallet/:userId/pay-ride', (req: Request, res: Response) => {
  try {
    const { rideId, amountEtb } = req.body;
    if (!rideId || !amountEtb) {
      return res.status(400).json({ error: 'rideId and amountEtb are required' });
    }

    const result = PaymentRoutingService.payWithPassengerWallet({
      userId: req.params.userId,
      rideId,
      amountEtb: Number(amountEtb),
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/wallet/exchange-rate
 * Exchange rates for international cards
 */
paymentRouter.get('/wallet-meta/exchange-rate', (_req: Request, res: Response) => {
  return res.json({
    baseCurrency: 'USD',
    targetCurrency: 'ETB',
    exchangeRate: 138.5,
    source: 'National Bank of Ethiopia (NBE) Indicative Rate',
    updatedAt: new Date().toISOString(),
  });
});
