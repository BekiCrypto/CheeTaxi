import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { WalletsService } from '../wallets/wallets.service';
import { GeoService } from '../geo/geo.service';

/**
 * Delivery platform — restaurant, pharmacy, grocery, and retail delivery.
 *
 * Flow:
 *   1. Merchant registers + creates menu categories + items
 *   2. Customer browses merchants by location → places order
 *   3. Merchant confirms → prepares → marks ready
 *   4. Driver picks up → delivers → customer confirms with OTP
 *   5. Payment released to merchant wallet (minus service fee)
 */
@Injectable()
export class DeliveryService {
  private readonly logger = new Logger('DeliveryService');

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private wallets: WalletsService,
    private geo: GeoService,
  ) {}

  // ─── Merchant management ────────────────────────────────────────────────

  async registerMerchant(ownerId: string, data: {
    name: string; type: string; phone: string; email?: string;
    country: string; city: string; address: string;
    latitude: number; longitude: number;
    deliveryRadiusM?: number; prepTimeMinutes?: number;
  }): Promise<{ merchantId: string }> {
    const geohash = this.geo.geohash(data.latitude, data.longitude);
    const merchant = await this.prisma.merchant.create({
      data: {
        ...data,
        country: data.country as any,
        geohash,
        deliveryRadiusM: data.deliveryRadiusM ?? 5000,
        prepTimeMinutes: data.prepTimeMinutes ?? 20,
        ownerId,
      },
    });
    return { merchantId: merchant.id };
  }

  async listNearbyMerchants(lat: number, lng: number, radiusM = 5000): Promise<any[]> {
    const geohash = this.geo.geohash(lat, lng, 4);
    const merchants = await this.prisma.merchant.findMany({
      where: {
        isActive: true,
        isVerified: true,
        geohash: { startsWith: geohash.slice(0, 3) },
      },
      include: { _count: { select: { menuItems: { where: { isAvailable: true } } } } },
    });

    // Filter by actual distance
    return merchants
      .map((m) => ({
        ...m,
        distanceMeters: this.geo.haversineMeters(
          { lat, lng },
          { lat: m.latitude, lng: m.longitude },
        ),
      }))
      .filter((m) => m.distanceMeters <= radiusM)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  // ─── Menu management ────────────────────────────────────────────────────

  async createCategory(merchantId: string, name: string, sortOrder = 0): Promise<any> {
    return this.prisma.menuCategory.create({
      data: { merchantId, name, sortOrder },
    });
  }

  async createMenuItem(merchantId: string, data: {
    name: string; description?: string; price: number; categoryId?: string;
    imageUrl?: string; prepTimeMinutes?: number; calories?: number;
    isVegetarian?: boolean; isVegan?: boolean; isHalal?: boolean; spiceLevel?: number;
  }): Promise<any> {
    return this.prisma.menuItem.create({
      data: {
        ...data,
        merchantId,
        price: data.price,
        isHalal: data.isHalal ?? true,
        spiceLevel: data.spiceLevel ?? 0,
      },
    });
  }

  async getMenu(merchantId: string): Promise<any> {
    return this.prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        menuCategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              where: { isAvailable: true },
              orderBy: { name: 'asc' },
            },
          },
        },
      },
    });
  }

  // ─── Order lifecycle ────────────────────────────────────────────────────

  async placeOrder(customerId: string, data: {
    merchantId: string;
    items: Array<{ menuItemId: string; quantity: number; specialInstructions?: string }>;
    deliveryAddress: string; deliveryLatitude: number; deliveryLongitude: number;
    deliveryInstructions?: string;
    paymentMethod?: string;
  }): Promise<{ orderId: string; publicId: string; total: number; deliveryOtp: string }> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: data.merchantId, isActive: true, isVerified: true },
    });
    if (!merchant) throw new NotFoundException('Merchant not found');

    // Validate items + compute subtotal
    const menuItemIds = data.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, merchantId: data.merchantId, isAvailable: true },
    });

    if (menuItems.length !== data.items.length) {
      throw new BadRequestException('Some items are unavailable');
    }

    let subtotal = 0;
    const orderItems = data.items.map((item) => {
      const menuItem = menuItems.find((m) => m.id === item.menuItemId)!;
      const totalPrice = Number(menuItem.price) * item.quantity;
      subtotal += totalPrice;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        totalPrice,
        specialInstructions: item.specialInstructions,
      };
    });

    const deliveryFee = this.computeDeliveryFee(merchant, data.deliveryLatitude, data.deliveryLongitude);
    const serviceFee = subtotal * 0.05; // 5% service fee
    const tax = subtotal * 0.15; // 15% VAT
    const total = subtotal + deliveryFee + serviceFee + tax;
    const deliveryOtp = String(randomInt(100000, 999999));

    // Charge customer wallet
    const paymentMethod = data.paymentMethod ?? 'WALLET';
    if (paymentMethod === 'WALLET') {
      await this.wallets.charge(customerId, total, 'ETB', 'DELIVERY_PAYMENT');
    }

    const order = await this.prisma.deliveryOrder.create({
      data: {
        merchantId: data.merchantId,
        customerId,
        status: 'placed',
        subtotal,
        deliveryFee,
        serviceFee,
        tax,
        total,
        currency: 'ETB',
        paymentMethod,
        paymentStatus: paymentMethod === 'WALLET' ? 'paid' : 'pending',
        deliveryAddress: data.deliveryAddress,
        deliveryLatitude: data.deliveryLatitude,
        deliveryLongitude: data.deliveryLongitude,
        deliveryInstructions: data.deliveryInstructions,
        deliveryOtp,
        items: { create: orderItems },
      },
      include: { items: { include: { menuItem: true } } },
    });

    return {
      orderId: order.id,
      publicId: order.publicId,
      total: Number(order.total),
      deliveryOtp,
    };
  }

  async confirmOrder(merchantId: string, orderId: string): Promise<any> {
    const order = await this.prisma.deliveryOrder.findFirst({
      where: { id: orderId, merchantId, status: 'placed' },
    });
    if (!order) throw new NotFoundException('Order not found or cannot be confirmed');

    return this.prisma.deliveryOrder.update({
      where: { id: orderId },
      data: { status: 'confirmed', confirmedAt: new Date() },
    });
  }

  async markReady(merchantId: string, orderId: string): Promise<any> {
    const order = await this.prisma.deliveryOrder.findFirst({
      where: { id: orderId, merchantId, status: { in: ['confirmed', 'preparing'] } },
    });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.deliveryOrder.update({
      where: { id: orderId },
      data: { status: 'ready', readyAt: new Date() },
    });
  }

  async assignDriver(orderId: string, driverId: string): Promise<any> {
    return this.prisma.deliveryOrder.update({
      where: { id: orderId, status: 'ready' },
      data: { driverId, status: 'picked_up', pickedUpAt: new Date() },
    });
  }

  async deliverOrder(orderId: string, otp: string): Promise<any> {
    const order = await this.prisma.deliveryOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.deliveryOtp !== otp) {
      throw new BadRequestException('Invalid delivery OTP');
    }

    const updated = await this.prisma.deliveryOrder.update({
      where: { id: orderId },
      data: { status: 'delivered', deliveredAt: new Date() },
    });

    // Pay merchant (subtotal minus service fee)
    const merchantPayout = Number(order.subtotal) - Number(order.serviceFee);
    const merchant = await this.prisma.merchant.findUnique({ where: { id: order.merchantId } });
    if (merchant) {
      await this.wallets.topUp(merchant.ownerId, merchantPayout, 'ETB', 'merchant_payout', orderId);
    }

    // Pay driver (delivery fee)
    if (order.driverId) {
      const driver = await this.prisma.driver.findUnique({ where: { id: order.driverId } });
      if (driver) {
        await this.wallets.topUp(driver.userId, Number(order.deliveryFee), 'ETB', 'delivery_payment', orderId);
      }
    }

    return updated;
  }

  async cancelOrder(orderId: string, reason: string, by: 'customer' | 'merchant' | 'system'): Promise<any> {
    const order = await this.prisma.deliveryOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (['delivered', 'cancelled'].includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled');
    }

    const updated = await this.prisma.deliveryOrder.update({
      where: { id: orderId },
      data: { status: 'cancelled', cancelledAt: new Date(), cancellationReason: reason },
    });

    // Refund customer if payment was made
    if (order.paymentStatus === 'paid') {
      await this.wallets.topUp(order.customerId, Number(order.total), 'ETB', 'delivery_refund', orderId);
    }

    return updated;
  }

  private computeDeliveryFee(merchant: any, deliveryLat: number, deliveryLng: number): number {
    const distance = this.geo.haversineMeters(
      { lat: merchant.latitude, lng: merchant.longitude },
      { lat: deliveryLat, lng: deliveryLng },
    );
    // Base fee + per-km fee
    const baseFee = 20;
    const perKmFee = 8;
    return Math.round(baseFee + (distance / 1000) * perKmFee);
  }
}
