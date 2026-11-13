import { Router } from 'express';
import { TelebirrService } from '../services/telebirrService.js';
import { DispatchService } from '../services/dispatchService.js';
import { Server as SocketIOServer } from 'socket.io';

export function createTelebirrRouter(io: SocketIOServer) {
  const router = Router();

  /**
   * Create Telebirr payment order
   */
  router.post('/order', (req, res) => {
    const { rideId, amountEtb, payerPhone, subject } = req.body;
    if (!rideId || !amountEtb || !payerPhone) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
      const order = TelebirrService.createOrder({
        rideId,
        amountEtb: Number(amountEtb),
        payerPhone,
        subject,
      });

      return res.status(201).json({ success: true, order });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * Simulate user paying on Telebirr app / USSD
   */
  router.post('/pay', (req, res) => {
    const { orderId, success = true } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    try {
      const order = TelebirrService.processPayment(orderId, Boolean(success));
      const ride = DispatchService.getRideById(order.rideId);

      // Notify clients
      if (ride) {
        io.to(`ride:${order.rideId}`).emit('ride:status_changed', ride);
        io.to('admin:dispatch').emit('admin:trip_updated', ride);
      }

      return res.json({ success: true, order });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  /**
   * Telebirr Webhook Callback (Ethio Telecom server-to-server callback)
   */
  router.post('/webhook', (req, res) => {
    const { out_trade_no, total_amount, trade_status } = req.body;
    console.log(`[Telebirr Webhook] Received notification for trade: ${out_trade_no}, status: ${trade_status}`);
    return res.json({ code: 0, message: 'success' });
  });

  return router;
}
