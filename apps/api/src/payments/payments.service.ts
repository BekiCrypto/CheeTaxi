import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { WalletsService } from '../wallets/wallets.service';

/**
 * Modular payment processor — abstracts multiple providers
 * (Stripe, Chapa, Telebirr, Cash, Wallet) behind a single interface.
 *
 * In production, each provider gets its own adapter file with webhook signature
 * verification. Here we implement the dispatch layer + provider routing.
 */

export interface PaymentProviderAdapter {
  name: string;
  initiate(payload: { amount: number; currency: string; reference: string; returnUrl: string; metadata?: unknown }): Promise<{ providerRef: string; checkoutUrl?: string }>;
  verify(webhookPayload: unknown): Promise<{ reference: string; status: 'SUCCESS' | 'FAILED'; amount: number; providerRef: string }>;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger('PaymentsService');

  constructor(
    private prisma: PrismaService,
    private wallets: WalletsService,
  ) {}

  async initiateTripPayment(tripId: string, method: string, provider: string): Promise<{ paymentId: string; checkoutUrl?: string }> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    const payment = await this.prisma.payment.create({
      data: {
        tripId,
        userId: trip.passengerUserId,
        amount: trip.totalFare,
        currency: trip.currency,
        method: method as any,
        provider,
        status: 'PENDING' as any,
      },
    });

    if (provider === 'cash') {
      // No external step — driver collects cash at dropoff
      return { paymentId: payment.id };
    }

    if (provider === 'wallet') {
      await this.wallets.charge(trip.passengerUserId, Number(trip.totalFare), trip.currency, 'TRIP_PAYMENT', trip.id);
      await this.markSuccess(payment.id, 'wallet', null);
      return { paymentId: payment.id };
    }

    // External providers (stub — wire real SDK in production)
    const adapter = this.getAdapter(provider);
    const result = await adapter.initiate({
      amount: Number(trip.totalFare),
      currency: trip.currency,
      reference: payment.id,
      returnUrl: `${process.env.WEB_BASE_URL}/trips/${trip.id}/payment/callback`,
      metadata: { tripId, passengerId: trip.passengerUserId },
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { providerRef: result.providerRef },
    });

    return { paymentId: payment.id, checkoutUrl: result.checkoutUrl };
  }

  async markSuccess(paymentId: string, provider: string, providerRef: string | null): Promise<void> {
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'SUCCESS' as any, provider, providerRef, processedAt: new Date() },
    });

    // If it was a trip payment, credit driver wallet
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId }, include: { trip: { include: { driver: true } } } });
    if (payment?.trip?.driverId) {
      await this.wallets.creditDriver(payment.trip.driverId, Number(payment.amount), payment.currency, payment.tripId);
    }
  }

  async markFailed(paymentId: string, reason: string): Promise<void> {
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'FAILED' as any, failedAt: new Date() },
    });
    this.logger.warn(`Payment ${paymentId} failed: ${reason}`);
  }

  /** Handle provider webhook. Routes to the correct adapter. */
  async handleWebhook(provider: string, payload: unknown): Promise<{ ok: true }> {
    const adapter = this.getAdapter(provider);
    const result = await adapter.verify(payload);
    if (result.status === 'SUCCESS') {
      await this.markSuccess(result.reference, provider, result.providerRef);
    } else {
      await this.markFailed(result.reference, 'Provider reported failure');
    }
    return { ok: true };
  }

  private getAdapter(provider: string): PaymentProviderAdapter {
    switch (provider) {
      case 'stripe':
        return new StripeAdapter();
      case 'chapa':
        return new ChapaAdapter();
      case 'telebirr':
        return new TelebirrAdapter();
      default:
        throw new Error(`Unknown payment provider: ${provider}`);
    }
  }
}

// ─── Provider Adapters (stubs — real SDK calls in production) ───────────────

class StripeAdapter implements PaymentProviderAdapter {
  name = 'stripe';
  async initiate(payload) {
    // In production: const session = await stripe.checkout.sessions.create({...})
    return { providerRef: `stripe_${payload.reference}`, checkoutUrl: `https://checkout.stripe.com/pay/${payload.reference}` };
  }
  async verify(payload) {
    // Verify signature, parse event
    const p = payload as any;
    return { reference: p.data.object.metadata.reference, status: 'SUCCESS', amount: p.data.object.amount_total, providerRef: p.id };
  }
}

class ChapaAdapter implements PaymentProviderAdapter {
  name = 'chapa';
  async initiate(payload) {
    // POST https://api.chapa.co/v1/transaction/initialize
    return { providerRef: `chapa_${payload.reference}`, checkoutUrl: `https://checkout.chapa.co/checkout/payment/${payload.reference}` };
  }
  async verify(payload) {
    const p = payload as any;
    return { reference: p.tx_ref, status: p.status === 'success' ? 'SUCCESS' : 'FAILED', amount: p.amount, providerRef: p.id };
  }
}

class TelebirrAdapter implements PaymentProviderAdapter {
  name = 'telebirr';
  async initiate(payload) {
    // POST https://app.ethiotelebirr.et/api/...
    return { providerRef: `telebirr_${payload.reference}`, checkoutUrl: `telebirr://pay?ref=${payload.reference}` };
  }
  async verify(payload) {
    const p = payload as any;
    return { reference: p.outTradeNo, status: p.code === 0 ? 'SUCCESS' : 'FAILED', amount: p.amount, providerRef: p.tradeNo };
  }
}
