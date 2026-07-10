import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

interface SendInput {
  channel: 'PUSH' | 'SMS' | 'EMAIL' | 'IN_APP' | 'WHATSAPP';
  code: string; // template code, e.g. 'TRIP_REQUESTED'
  vars?: Record<string, string>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('NotificationsService');

  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
  ) {}

  /** Resolve template + render variables + persist + dispatch to provider. */
  async sendToUser(userId: string, input: SendInput): Promise<void> {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { code_channel_language: { code: input.code, channel: input.channel, language: 'en' } },
    });
    const title = template ? this.render(template.title, input.vars) : input.code;
    const body = template ? this.render(template.body, input.vars) : JSON.stringify(input.vars ?? {});

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        channel: input.channel as any,
        title,
        body,
        payload: { code: input.code, vars: input.vars },
        status: 'QUEUED' as any,
      },
    });

    // Real-time push via WebSocket to online clients (instant UI update)
    this.realtime.emitNotification(userId, {
      id: notification.id,
      title,
      body,
      channel: input.channel,
      code: input.code,
      vars: input.vars,
      createdAt: notification.createdAt,
    });

    // Dispatch (non-blocking) — real impl wires Firebase / Twilio / SendGrid / WhatsApp BSP
    void this.dispatch(notification.id, input.channel).catch((err) =>
      this.logger.error(`Failed to dispatch notification ${notification.id}: ${err.message}`),
    );
  }

  private async dispatch(notificationId: string, channel: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) return;

    try {
      switch (channel) {
        case 'PUSH': {
          // Real impl: admin.messaging(firebaseApp).send({...})
          this.logger.log(`[PUSH] ${notification.title} → user ${notification.userId}`);
          break;
        }
        case 'SMS': {
          // Real impl: twilio.messages.create({ to, from, body })
          this.logger.log(`[SMS] ${notification.body} → user ${notification.userId}`);
          break;
        }
        case 'EMAIL': {
          // Real impl: sendgrid.send({...})
          this.logger.log(`[EMAIL] ${notification.title} → user ${notification.userId}`);
          break;
        }
        case 'IN_APP': {
          // Stored in DB — fetched via GET /notifications
          break;
        }
        case 'WHATSAPP': {
          // BSP integration (e.g. 360dialog, Twilio WhatsApp)
          this.logger.log(`[WHATSAPP] ${notification.body} → user ${notification.userId}`);
          break;
        }
      }
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'SENT' as any, sentAt: new Date() },
      });
    } catch (err) {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'FAILED' as any, failureReason: (err as Error).message },
      });
    }
  }

  async listForUser(userId: string, page = 1, limit = 20, unreadOnly = false) {
    const where = { userId, ...(unreadOnly ? { readAt: null } : {}) };
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async markRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { status: 'READ' as any, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { status: 'READ' as any, readAt: new Date() },
    });
  }

  private render(template: string, vars?: Record<string, string>): string {
    if (!vars) return template;
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
  }
}
