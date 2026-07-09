import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class WalletsService {
  private readonly logger = new Logger('WalletsService');

  constructor(private prisma: PrismaService) {}

  async getMyWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId, type: 'PASSENGER' as any, balance: 0, currency: 'ETB' },
      });
    }
    return wallet;
  }

  async topUp(userId: string, amount: number, currency: string, provider: string, providerRef?: string): Promise<void> {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const wallet = await this.getMyWallet(userId);
    const balanceBefore = Number(wallet.balance);

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'WALLET_TOP_UP' as any,
          amount,
          balanceBefore,
          balanceAfter: Number(updated.balance),
          currency,
          reference: `WAL-${nanoid(12).toUpperCase()}`,
          paymentId: providerRef,
          initiatedBy: userId,
          status: 'SUCCESS' as any,
          metadata: { provider },
        },
      });
    });
  }

  async charge(userId: string, amount: number, currency: string, type: string, referenceId?: string): Promise<void> {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    const wallet = await this.getMyWallet(userId);
    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }
    const balanceBefore = Number(wallet.balance);

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: type as any,
          amount: -amount,
          balanceBefore,
          balanceAfter: Number(updated.balance),
          currency,
          reference: `WAL-${nanoid(12).toUpperCase()}`,
          description: referenceId,
          status: 'SUCCESS' as any,
        },
      });
    });
  }

  /** Pay driver earnings on trip completion (called by TripsService). */
  async creditDriver(driverId: string, amount: number, currency: string, tripId: string): Promise<void> {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Driver not found');

    let wallet = await this.prisma.wallet.findUnique({ where: { userId: driver.userId } });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId: driver.userId, type: 'DRIVER' as any, balance: 0, currency },
      });
    }
    const balanceBefore = Number(wallet.balance);

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: driver.userId,
          type: 'TRIP_PAYMENT' as any,
          amount,
          balanceBefore,
          balanceAfter: Number(updated.balance),
          currency,
          reference: `TRIP-${tripId.slice(0, 8).toUpperCase()}`,
          tripId,
          status: 'SUCCESS' as any,
        },
      });
    });
  }

  async requestWithdrawal(driverUserId: string, amount: number, method: string, destination: unknown): Promise<void> {
    const wallet = await this.getMyWallet(driverUserId);
    if (Number(wallet.balance) < amount) throw new BadRequestException('Insufficient balance');

    const driver = await this.prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) throw new NotFoundException('Driver not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { pendingBalance: { increment: amount }, balance: { decrement: amount } },
      });
      await tx.withdrawalRequest.create({
        data: {
          driverId: driver.id,
          amount,
          currency: wallet.currency,
          method,
          destination: destination as any,
          status: 'PENDING' as any,
        },
      });
    });
  }

  async listTransactions(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where: { userId } }),
    ]);
    return { items, total, page, limit };
  }
}
