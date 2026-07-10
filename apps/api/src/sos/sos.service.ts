import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SosService {
  private readonly logger = new Logger('SosService');

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async trigger(userId: string, data: { tripId?: string; latitude: number; longitude: number; accuracyMeters?: number; reason?: string }) {
    const alert = await this.prisma.sOSAlert.create({
      data: {
        userId,
        tripId: data.tripId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracyMeters: data.accuracyMeters,
        reason: data.reason,
        status: 'TRIGGERED' as any,
      },
      include: { user: { select: { firstName: true, lastName: true, phone: true } } },
    });

    // Notify safety team (super_admin + safety role) in parallel
    const safetyTeam = await this.prisma.userRoleAssignment.findMany({
      where: { role: { in: ['SUPER_ADMIN' as any, 'SAFETY' as any] } },
      select: { userId: true },
    });
    await Promise.all(
      safetyTeam.map((s) =>
        this.notifications.sendToUser(s.userId, {
          channel: 'IN_APP',
          code: 'SOS_TRIGGERED',
          vars: {
            userName: `${alert.user.firstName} ${alert.user.lastName}`,
            phone: alert.user.phone,
            location: `${data.latitude},${data.longitude}`,
            reason: data.reason ?? 'No reason provided',
          },
        }),
      ),
    );

    // Acknowledge to user
    await this.notifications.sendToUser(userId, {
      channel: 'PUSH',
      code: 'SOS_ACKNOWLEDGED',
    });

    this.logger.warn(`SOS triggered by ${userId} at ${data.latitude},${data.longitude}`);
    return alert;
  }

  async acknowledge(alertId: string, safetyUserId: string) {
    return this.prisma.sOSAlert.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED' as any,
        acknowledgedBy: safetyUserId,
        acknowledgedAt: new Date(),
      },
    });
  }

  async resolve(alertId: string, resolution: string) {
    return this.prisma.sOSAlert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED' as any,
        resolvedAt: new Date(),
        resolution,
      },
    });
  }

  async listActive() {
    return this.prisma.sOSAlert.findMany({
      where: { status: { in: ['TRIGGERED' as any, 'ACKNOWLEDGED' as any] } },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true, phone: true } }, trip: true },
    });
  }
}
