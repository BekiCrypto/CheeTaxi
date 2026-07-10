import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async createPromo(data: {
    code: string;
    type: string;
    value: number;
    currency?: string;
    maxRedemptions?: number;
    perUserLimit?: number;
    startsAt: string;
    endsAt?: string;
    minTripFare?: number;
    appliesTo?: string[];
  }) {
    return this.prisma.promoCode.create({
      data: {
        code: data.code.toUpperCase(),
        type: data.type as any,
        value: data.value,
        currency: data.currency ?? 'ETB',
        maxRedemptions: data.maxRedemptions,
        perUserLimit: data.perUserLimit ?? 1,
        startsAt: new Date(data.startsAt),
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        minTripFare: data.minTripFare,
        appliesTo: (data.appliesTo ?? []) as any,
      },
    });
  }

  async listActive() {
    return this.prisma.promoCode.findMany({
      where: { isActive: true, endsAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async redeem(userId: string, code: string, tripId?: string) {
    const promo = await this.prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } });
    if (!promo || !promo.isActive) throw new NotFoundException('Promo code not found');
    if (promo.endsAt && promo.endsAt < new Date()) throw new BadRequestException('Promo code expired');
    if (promo.startsAt > new Date()) throw new BadRequestException('Promo code not yet active');

    const redemptionCount = await this.prisma.promoRedemption.count({ where: { promoCodeId: promo.id } });
    if (promo.maxRedemptions && redemptionCount >= promo.maxRedemptions) {
      throw new BadRequestException('Promo code fully redeemed');
    }

    const userRedemptions = await this.prisma.promoRedemption.count({ where: { promoCodeId: promo.id, userId } });
    if (userRedemptions >= promo.perUserLimit) {
      throw new BadRequestException('You have already used this promo code');
    }

    return this.prisma.promoRedemption.create({
      data: { promoCodeId: promo.id, userId, tripId },
    });
  }

  async listReferrals(userId: string) {
    return this.prisma.referral.findMany({
      where: { referrerUserId: userId },
      include: { referredUser: { select: { firstName: true, lastName: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
