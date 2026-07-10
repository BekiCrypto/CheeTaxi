import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger('SubscriptionsService');

  constructor(
    private prisma: PrismaService,
    private wallets: WalletsService,
  ) {}

  async listPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: [{ tier: 'asc' }, { price: 'asc' }],
    });
  }

  async getPlan(code: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { code } });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async purchase(userId: string, data: { planCode: string; paymentMethod: string; autoRenew?: boolean; driverIds?: string[] }) {
    const plan = await this.getPlan(data.planCode);

    // Check for existing active subscription
    const existing = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE', endsAt: { gt: new Date() } },
    });
    if (existing) throw new BadRequestException('You already have an active subscription');

    // Create subscription in pending state
    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: 'PENDING_PAYMENT',
        autoRenew: data.autoRenew ?? false,
        amountPaid: plan.price,
        currency: plan.currency,
      },
    });

    // Process payment (cash handled immediately; card/wallet routes through PaymentsService)
    if (data.paymentMethod === 'CASH') {
      await this.activate(subscription.id, userId, 'cash');
    } else if (data.paymentMethod === 'WALLET') {
      await this.wallets.charge(userId, plan.price, plan.currency, 'SUBSCRIPTION_PAYMENT', subscription.id);
      await this.activate(subscription.id, userId, 'wallet');
    }
    // For CARD: webhook from payment provider will trigger activate()

    return subscription;
  }

  async activate(subscriptionId: string, userId: string, paymentProvider: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });
    if (!sub) throw new NotFoundException('Subscription not found');

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + sub.plan.durationDays * 24 * 3600 * 1000);

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'ACTIVE',
        startsAt,
        endsAt,
        amountPaid: sub.plan.price,
      },
    });

    // If fleet plan, assign drivers
    if (sub.plan.maxDrivers > 1) {
      // drivers are passed separately; for single-driver plans, auto-assign
    }

    return updated;
  }

  async getMyActive(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE', endsAt: { gt: new Date() } },
      include: { plan: true, driverAssignments: { include: { driver: true } } },
    });
  }

  async listMyHistory(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancel(userId: string, subscriptionId: string, reason: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason: reason },
    });
  }

  /** Check if a driver has an active subscription — used by DispatchService. */
  async driverHasActive(driverId: string): Promise<boolean> {
    const assignments = await this.prisma.driverSubscriptionAssignment.findMany({
      where: { driverId },
      include: { subscription: true },
    });
    return assignments.some((a) => a.subscription.status === 'ACTIVE' && a.subscription.endsAt && a.subscription.endsAt > new Date());
  }

  /** Admin: list all subscriptions. */
  async listAll(page = 1, limit = 50, status?: string) {
    const [items, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where: status ? { status: status as any } : undefined,
        include: { plan: true, user: { select: { firstName: true, lastName: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.subscription.count({ where: status ? { status: status as any } : undefined }),
    ]);
    return { items, total, page, limit };
  }
}
