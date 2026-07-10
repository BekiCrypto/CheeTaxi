import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createHmac } from 'crypto';
import { nanoid } from 'nanoid';
import { PrismaService } from '../common/prisma.service';

/**
 * Webhook system for partner integrations.
 *
 * Flow:
 *   1. Partner registers an endpoint via POST /webhooks/endpoints
 *      (URL + events to subscribe to + auto-generated HMAC secret)
 *   2. Platform events trigger WebhooksService.trigger(event, payload)
 *   3. Delivery is queued in WebhookDelivery with HMAC-SHA256 signature
 *   4. Cron job #deliverPending sends pending deliveries with exponential backoff
 *   5. After maxAttempts, delivery is marked failed and endpoint failureCount++
 *
 * Signature: HMAC-SHA256(payload, endpoint.secret), base64-encoded, sent in
 * X-CheeTaxi-Signature header. Partners verify on receipt.
 */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger('WebhooksService');
  private readonly MAX_ATTEMPTS = 5;
  private readonly TIMEOUT_MS = 10000;

  constructor(private prisma: PrismaService) {}

  /** Register a new webhook endpoint. Returns the secret ONCE — partners must store it. */
  async createEndpoint(userId: string, data: { url: string; events: string[]; description?: string }): Promise<{ id: string; secret: string }> {
    const secret = `whsec_${nanoid(32)}`;
    const endpoint = await this.prisma.webhookEndpoint.create({
      data: {
        userId,
        url: data.url,
        secret,
        events: data.events,
        description: data.description,
      },
    });
    return { id: endpoint.id, secret };
  }

  async listEndpoints(userId: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: { userId },
      include: { _count: { select: { deliveries: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteEndpoint(userId: string, id: string): Promise<void> {
    await this.prisma.webhookEndpoint.deleteMany({ where: { id, userId } });
  }

  /** Trigger an event — finds all active endpoints subscribed to it and queues deliveries. */
  async trigger(event: string, payload: unknown): Promise<void> {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { isActive: true, events: { has: event } },
    });

    if (endpoints.length === 0) return;

    for (const endpoint of endpoints) {
      const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
      const signature = this.sign(body, endpoint.secret);

      await this.prisma.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          event,
          payload: payload as any,
          signature,
          status: 'pending',
          maxAttempts: this.MAX_ATTEMPTS,
        },
      });
    }

    this.logger.debug(`Triggered event ${event} → ${endpoints.length} endpoints`);
  }

  /** Cron job — delivers pending webhooks with exponential backoff retry. */
  @Cron(CronExpression.EVERY_MINUTE)
  async deliverPending(): Promise<void> {
    const now = new Date();
    const pending = await this.prisma.webhookDelivery.findMany({
      where: {
        status: { in: ['pending', 'retrying'] },
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
        attempts: { lt: this.MAX_ATTEMPTS },
      },
      include: { endpoint: true },
      take: 50,
      orderBy: { createdAt: 'asc' },
    });

    for (const delivery of pending) {
      if (!delivery.endpoint || !delivery.endpoint.isActive) {
        await this.prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: { status: 'failed', responseBody: 'endpoint inactive' },
        });
        continue;
      }
      await this.attemptDelivery(delivery);
    }
  }

  private async attemptDelivery(delivery: any): Promise<void> {
    const body = JSON.stringify({
      event: delivery.event,
      payload: delivery.payload,
      timestamp: delivery.createdAt,
    });

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const res = await fetch(delivery.endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CheeTaxi-Signature': delivery.signature,
          'X-CheeTaxi-Event': delivery.event,
          'X-CheeTaxi-Delivery': delivery.id,
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const responseText = await res.text().catch(() => '');

      if (res.ok) {
        // Success — update delivery + endpoint
        await this.prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'success',
            attempts: { increment: 1 },
            responseStatus: res.status,
            responseBody: responseText.slice(0, 1000),
            deliveredAt: new Date(),
          },
        });
        await this.prisma.webhookEndpoint.update({
          where: { id: delivery.endpointId },
          data: {
            lastTriggeredAt: new Date(),
            lastResponseStatus: res.status,
            failureCount: 0,
          },
        });
      } else {
        await this.handleFailure(delivery, res.status, responseText);
      }
    } catch (err) {
      await this.handleFailure(delivery, 0, (err as Error).message);
    }
  }

  private async handleFailure(delivery: any, status: number, body: string): Promise<void> {
    const attempts = delivery.attempts + 1;
    const isLastAttempt = attempts >= delivery.maxAttempts;

    // Exponential backoff: 1m, 5m, 25m, 125m, 625m
    const backoffMinutes = Math.pow(5, attempts - 1);
    const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

    await this.prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        attempts,
        status: isLastAttempt ? 'failed' : 'retrying',
        responseStatus: status,
        responseBody: body.slice(0, 1000),
        nextRetryAt: isLastAttempt ? null : nextRetryAt,
      },
    });

    await this.prisma.webhookEndpoint.update({
      where: { id: delivery.endpointId },
      data: {
        lastResponseStatus: status,
        failureCount: { increment: 1 },
      },
    });

    if (isLastAttempt) {
      this.logger.warn(`Webhook delivery ${delivery.id} permanently failed after ${attempts} attempts`);
    }
  }

  private sign(body: string, secret: string): string {
    return createHmac('sha256', secret).update(body).digest('hex');
  }

  /** Verify a webhook signature — partners call this on receipt. */
  verifySignature(body: string, signature: string, secret: string): boolean {
    const expected = this.sign(body, secret);
    // Constant-time comparison to prevent timing attacks
    if (expected.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
  }
}
