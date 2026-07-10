import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { WalletsService } from '../wallets/wallets.service';

/**
 * Super app services — transforms CheeTaxi from a ride-hailing app into
 * a financial services platform for Africa.
 *
 * Modules:
 *   • Bill payments — electricity, water, telecom, TV
 *   • Micro-insurance — per-trip and per-vehicle cover
 *   • Loyalty program — points, tiers, rewards
 *   • Driver loans — advance against future earnings
 */
@Injectable()
export class SuperAppService {
  private readonly logger = new Logger('SuperAppService');

  // Loyalty tier thresholds (lifetime points)
  private readonly TIER_THRESHOLDS = {
    bronze: 0,
    silver: 1000,
    gold: 5000,
    platinum: 20000,
  };

  // Points earned per birr spent
  private readonly POINTS_PER_BIRR = 1;

  constructor(
    private prisma: PrismaService,
    private wallets: WalletsService,
  ) {}

  // ─── Bill Payments ──────────────────────────────────────────────────────

  async payBill(userId: string, data: {
    billType: string; provider: string; accountNumber: string; amount: number; currency?: string;
  }): Promise<{ billPaymentId: string; status: string }> {
    if (data.amount <= 0) throw new BadRequestException('Amount must be positive');

    const fee = this.computeBillFee(data.amount, data.billType);
    const total = data.amount + fee;

    // Charge user wallet
    await this.wallets.charge(userId, total, data.currency ?? 'ETB', 'BILL_PAYMENT');

    const bill = await this.prisma.billPayment.create({
      data: {
        userId,
        billType: data.billType,
        provider: data.provider,
        accountNumber: data.accountNumber,
        amount: data.amount,
        currency: data.currency ?? 'ETB',
        fee,
        status: 'pending',
      },
    });

    // Dispatch to biller API (real impl: per-provider integration)
    void this.processBillPayment(bill.id).catch((err) =>
      this.logger.error(`Bill payment ${bill.id} failed: ${err.message}`),
    );

    return { billPaymentId: bill.id, status: 'pending' };
  }

  async listBillPayments(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.billPayment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.billPayment.count({ where: { userId } }),
    ]);
    return { items, total, page, limit };
  }

  private computeBillFee(amount: number, billType: string): number {
    // Flat fee structure — real impl would be per-provider
    const fees: Record<string, number> = {
      electricity: 5,
      water: 3,
      telecom: 2,
      tv: 5,
      internet: 2,
    };
    return fees[billType] ?? 5;
  }

  private async processBillPayment(billId: string): Promise<void> {
    const bill = await this.prisma.billPayment.findUnique({ where: { id: billId } });
    if (!bill) return;

    try {
      // Real impl: call biller API (EEU, Ethio Telecom, etc.)
      // For now, mark as success after a short delay
      await new Promise((r) => setTimeout(r, 1000));

      await this.prisma.billPayment.update({
        where: { id: billId },
        data: { status: 'success', processedAt: new Date(), providerRef: `biller_${billId.slice(0, 8)}` },
      });
    } catch (err) {
      await this.prisma.billPayment.update({
        where: { id: billId },
        data: { status: 'failed', processedAt: new Date() },
      });
      // Refund the wallet
      await this.wallets.topUp(bill.userId, Number(bill.amount) + Number(bill.fee), bill.currency, 'bill_refund', billId);
    }
  }

  // ─── Micro-Insurance ────────────────────────────────────────────────────

  async purchaseInsurance(userId: string, data: {
    type: string; provider: string; premium: number; coverageAmount: number;
    currency?: string; tripId?: string; durationDays?: number;
  }): Promise<{ policyId: string }> {
    // Charge premium to wallet
    await this.wallets.charge(userId, data.premium, data.currency ?? 'ETB', 'INSURANCE_PREMIUM');

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + (data.durationDays ?? 30) * 24 * 3600 * 1000);

    const policy = await this.prisma.insurancePolicy.create({
      data: {
        userId,
        type: data.type,
        provider: data.provider,
        premium: data.premium,
        currency: data.currency ?? 'ETB',
        coverageAmount: data.coverageAmount,
        status: 'active',
        startsAt,
        endsAt,
        tripId: data.tripId,
      },
    });

    return { policyId: policy.id };
  }

  async fileClaim(userId: string, policyId: string, data: {
    amount: number; reason: string; description: string; attachments?: unknown;
  }): Promise<{ claimId: string }> {
    const policy = await this.prisma.insurancePolicy.findFirst({
      where: { id: policyId, userId, status: 'active' },
    });
    if (!policy) throw new NotFoundException('Active insurance policy not found');
    if (data.amount > Number(policy.coverageAmount)) {
      throw new BadRequestException('Claim amount exceeds coverage');
    }

    const claim = await this.prisma.insuranceClaim.create({
      data: {
        policyId,
        userId,
        amount: data.amount,
        currency: policy.currency,
        reason: data.reason,
        description: data.description,
        attachments: data.attachments as any,
        status: 'submitted',
      },
    });
    return { claimId: claim.id };
  }

  async listMyPolicies(userId: string) {
    return this.prisma.insurancePolicy.findMany({
      where: { userId },
      include: { _count: { select: { claims: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Loyalty Program ────────────────────────────────────────────────────

  async getOrCreateAccount(userId: string) {
    let account = await this.prisma.loyaltyAccount.findUnique({ where: { userId } });
    if (!account) {
      account = await this.prisma.loyaltyAccount.create({ data: { userId } });
    }
    return account;
  }

  /** Award points for a completed trip — called by TripsService on completion. */
  async awardTripPoints(userId: string, tripId: string, fare: number): Promise<void> {
    const account = await this.getOrCreateAccount(userId);
    const points = Math.floor(fare * this.POINTS_PER_BIRR);

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: { increment: points },
          lifetimePoints: { increment: points },
        },
      });
      await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          points,
          reason: 'trip_completed',
          tripId,
        },
      });
      // Auto-upgrade tier
      const newTier = this.computeTier(updated.lifetimePoints);
      if (newTier !== updated.tier) {
        await tx.loyaltyAccount.update({
          where: { id: account.id },
          data: { tier: newTier },
        });
      }
    });
  }

  async redeemPoints(userId: string, data: {
    rewardType: string; pointsCost: number; value: number; currency?: string;
  }): Promise<{ redemptionId: string }> {
    const account = await this.getOrCreateAccount(userId);
    if (account.points < data.pointsCost) {
      throw new BadRequestException('Insufficient points');
    }

    const redemption = await this.prisma.$transaction(async (tx) => {
      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: { points: { decrement: data.pointsCost } },
      });
      await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          points: -data.pointsCost,
          reason: 'redemption',
        },
      });
      return tx.loyaltyRedemption.create({
        data: {
          accountId: account.id,
          rewardType: data.rewardType,
          pointsCost: data.pointsCost,
          value: data.value,
          currency: data.currency ?? 'ETB',
          status: 'fulfilled',
          fulfilledAt: new Date(),
        },
      });
    });

    // If wallet credit, top up the wallet
    if (data.rewardType === 'wallet_credit') {
      await this.wallets.topUp(userId, data.value, data.currency ?? 'ETB', 'loyalty_redemption', redemption.id);
    }

    return { redemptionId: redemption.id };
  }

  private computeTier(lifetimePoints: number): string {
    if (lifetimePoints >= this.TIER_THRESHOLDS.platinum) return 'platinum';
    if (lifetimePoints >= this.TIER_THRESHOLDS.gold) return 'gold';
    if (lifetimePoints >= this.TIER_THRESHOLDS.silver) return 'silver';
    return 'bronze';
  }

  // ─── Driver Loans ───────────────────────────────────────────────────────

  async applyForLoan(driverId: string, data: {
    amount: number; currency?: string; termDays: number; interestRate?: number;
  }): Promise<{ loanId: string; status: string }> {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Driver not found');

    // Eligibility: must have completed ≥ 50 trips and have an active subscription
    if (driver.completedTrips < 50) {
      throw new BadRequestException('Drivers need ≥ 50 completed trips to apply for a loan');
    }

    const interestRate = data.interestRate ?? 12; // 12% APR default
    const loan = await this.prisma.driverLoan.create({
      data: {
        driverId,
        amount: data.amount,
        currency: data.currency ?? 'ETB',
        interestRate,
        termDays: data.termDays,
        remainingBalance: data.amount * (1 + (interestRate / 100) * (data.termDays / 365)),
        status: 'pending',
      },
    });

    return { loanId: loan.id, status: 'pending' };
  }

  async approveLoan(loanId: string, approvedBy: string): Promise<void> {
    const loan = await this.prisma.driverLoan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== 'pending') throw new BadRequestException('Loan is not pending');

    const driver = await this.prisma.driver.findUnique({ where: { id: loan.driverId } });
    if (!driver) throw new NotFoundException('Driver not found');

    await this.prisma.driverLoan.update({
      where: { id: loanId },
      data: {
        status: 'active',
        approvedBy,
        approvedAt: new Date(),
        disbursedAt: new Date(),
      },
    });

    // Disburse to driver wallet
    await this.wallets.topUp(driver.userId, Number(loan.amount), loan.currency, 'driver_loan', loanId);
  }

  /** Auto-deduct loan repayment from driver earnings — called on trip completion. */
  async deductLoanRepayment(driverId: string, tripId: string, earnings: number): Promise<void> {
    const activeLoan = await this.prisma.driverLoan.findFirst({
      where: { driverId, status: 'active' },
      orderBy: { disbursedAt: 'asc' },
    });
    if (!activeLoan) return;

    // Deduct 20% of earnings toward loan repayment
    const repayment = Math.min(earnings * 0.2, Number(activeLoan.remainingBalance));
    if (repayment <= 0) return;

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.driverLoan.update({
        where: { id: activeLoan.id },
        data: { remainingBalance: { decrement: repayment } },
      });
      await tx.driverLoanRepayment.create({
        data: {
          loanId: activeLoan.id,
          amount: repayment,
          currency: activeLoan.currency,
          source: 'trip_earnings',
          tripId,
        },
      });
      // If fully repaid, mark as paid
      if (Number(updated.remainingBalance) <= 0) {
        await tx.driverLoan.update({
          where: { id: activeLoan.id },
          data: { status: 'paid', fullyRepaidAt: new Date() },
        });
      }
    });

    // Charge the driver wallet for the repayment
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (driver) {
      await this.wallets.charge(driver.userId, repayment, activeLoan.currency, 'LOAN_REPAYMENT', tripId);
    }
  }
}
