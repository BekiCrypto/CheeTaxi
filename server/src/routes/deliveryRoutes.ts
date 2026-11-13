import { Router } from 'express';
import { DeliveryService } from '../services/deliveryService.js';
import { Server as SocketIOServer } from 'socket.io';

export function createDeliveryRouter(io: SocketIOServer) {
  const router = Router();

  /**
   * Create new delivery order
   */
  router.post('/', (req, res) => {
    const {
      senderId,
      senderName,
      senderPhone,
      recipientName,
      recipientPhone,
      pickup,
      dropoff,
      category,
      packageDescription,
      weightKg,
      deliverySpeed,
      paymentMethod,
    } = req.body;

    if (!senderId || !pickup || !dropoff || !recipientPhone || !packageDescription) {
      return res.status(400).json({ error: 'Missing mandatory delivery parameters' });
    }

    try {
      const order = DeliveryService.createOrder({
        senderId,
        senderName: senderName || 'Sender',
        senderPhone: senderPhone || '+251...',
        recipientName: recipientName || 'Recipient',
        recipientPhone,
        pickup,
        dropoff,
        category: category || 'parcel',
        packageDescription,
        weightKg: Number(weightKg) || 1.0,
        deliverySpeed: deliverySpeed || 'standard',
        paymentMethod: paymentMethod || 'TELEBIRR',
      });

      if (order.courierId) {
        io.to(`driver:${order.courierId}`).emit('courier:incoming_delivery', order);
      }
      io.to('admin:dispatch').emit('admin:new_delivery', order);

      return res.status(201).json({ success: true, order });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  /**
   * Get delivery order details
   */
  router.get('/:id', (req, res) => {
    const order = DeliveryService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Delivery order not found' });
    return res.json({ order });
  });

  /**
   * List deliveries
   */
  router.get('/', (req, res) => {
    const userId = req.query.userId as string;
    const orders = DeliveryService.listDeliveries(userId);
    return res.json({ orders });
  });

  /**
   * Courier confirms pickup with Sender OTP
   */
  router.post('/:id/pickup', (req, res) => {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ error: 'Pickup OTP is required' });

    try {
      const order = DeliveryService.verifyPickup(req.params.id, otp);
      io.to(`delivery:${order.id}`).emit('delivery:status_changed', order);
      io.to('admin:dispatch').emit('admin:delivery_updated', order);
      return res.json({ success: true, order });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  /**
   * Courier confirms delivery dropoff with Recipient OTP & proof photo
   */
  router.post('/:id/complete', (req, res) => {
    const { otp, proofPhotoUrl, signatureUrl } = req.body;
    if (!otp) return res.status(400).json({ error: 'Dropoff OTP is required' });

    try {
      const order = DeliveryService.completeDelivery(
        req.params.id,
        otp,
        proofPhotoUrl,
        signatureUrl
      );
      io.to(`delivery:${order.id}`).emit('delivery:status_changed', order);
      io.to('admin:dispatch').emit('admin:delivery_updated', order);
      return res.json({ success: true, order });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  return router;
}
