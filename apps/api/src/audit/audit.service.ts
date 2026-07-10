import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditService');

  constructor(private prisma: PrismaService) {}

  async log(entry: {
    actorUserId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    before?: unknown;
    after?: unknown;
    ipAddress?: string;
    userAgent?: string;
    metadata?: unknown;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorUserId: entry.actorUserId,
          action: entry.action as any,
          resource: entry.resource,
          resourceId: entry.resourceId,
          before: entry.before as any,
          after: entry.after as any,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          metadata: entry.metadata as any,
        },
      });
    } catch (err) {
      // Never let audit failure break the request
      this.logger.error(`Audit log failed: ${(err as Error).message}`);
    }
  }

  async list(filters: {
    page?: number;
    limit?: number;
    actorUserId?: string;
    action?: string;
    resource?: string;
    from?: string;
    to?: string;
  }) {
    const { page = 1, limit = 50, actorUserId, action, resource, from, to } = filters;
    const where = {
      ...(actorUserId ? { actorUserId } : {}),
      ...(action ? { action: action as any } : {}),
      ...(resource ? { resource } : {}),
      ...(from || to
        ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { actor: { select: { firstName: true, lastName: true, email: true, phone: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, limit };
  }
}
