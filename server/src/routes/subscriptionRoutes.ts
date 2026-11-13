import { Router } from 'express';
import { SubscriptionService } from '../services/subscriptionService.js';
import { Server as SocketIOServer } from 'socket.io';

export function createSubscriptionRouter(io: SocketIOServer) {
  const router = Router();

  /**
   * Get available subscription plans
   */
  router.get('/plans', (req, res) => {
    const country = (req.query.country as string) || 'ET';
    const city = (req.query.city as string) || 'ADDIS_ABABA';
    const plans = SubscriptionService.getPlans(country, city);
    return res.json({ plans });
  });

  /**
   * Check driver's entitlement to go online and receive rides
   */
  router.get('/driver/:driverId', (req, res) => {
    const entitlement = SubscriptionService.checkDriverEntitlement(req.params.driverId);
    return res.json({ entitlement });
  });

  /**
   * Purchase or renew subscription pass
   */
  router.post('/subscribe', (req, res) => {
    const { driverId, planId, paymentMethod = 'TELEBIRR', paymentReference } = req.body;
    if (!driverId || !planId) {
      return res.status(400).json({ error: 'driverId and planId are required' });
    }

    try {
      const subscription = SubscriptionService.subscribe(
        driverId,
        planId,
        paymentMethod,
        paymentReference
      );

      io.to(`driver:${driverId}`).emit('driver:subscription_updated', subscription);
      io.to('admin:dispatch').emit('admin:subscription_purchased', { driverId, planId, subscription });

      return res.status(201).json({ success: true, subscription });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  /**
   * Admin-issued trial or sponsored access
   */
  router.post('/grant-trial', (req, res) => {
    const { driverId, durationDays = 7, reason } = req.body;
    if (!driverId) {
      return res.status(400).json({ error: 'driverId is required' });
    }

    const sub = SubscriptionService.grantTrialOrSponsored(driverId, Number(durationDays), reason);
    io.to(`driver:${driverId}`).emit('driver:subscription_updated', sub);

    return res.json({ success: true, subscription: sub });
  });

  return router;
}
