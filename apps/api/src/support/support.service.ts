import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createTicket(userId: string, data: { subject: string; description: string; category: string; priority?: string }) {
    return this.prisma.supportTicket.create({
      data: {
        reporterUserId: userId,
        subject: data.subject,
        description: data.description,
        category: data.category,
        priority: (data.priority ?? 'MEDIUM') as any,
        status: 'OPEN' as any,
      },
    });
  }

  async addMessage(userId: string, ticketId: string, body: string, isInternal = false) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } });
    return this.prisma.supportMessage.create({
      data: {
        ticketId,
        senderId: userId,
        senderName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        body,
        isInternal,
      },
    });
  }

  async listMyTickets(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where: { reporterUserId: userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { messages: true } } },
      }),
      this.prisma.supportTicket.count({ where: { reporterUserId: userId } }),
    ]);
    return { items, total, page, limit };
  }

  async listAllTickets(page = 1, limit = 50, status?: string) {
    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where: status ? { status: status as any } : undefined,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          reporter: { select: { firstName: true, lastName: true, phone: true } },
          assignee: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.supportTicket.count({ where: status ? { status: status as any } : undefined }),
    ]);
    return { items, total, page, limit };
  }

  async assign(ticketId: string, assigneeId: string) {
    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assigneeId, status: 'IN_PROGRESS' as any, firstResponseAt: new Date() },
    });
  }

  async resolve(ticketId: string, resolution: string) {
    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: 'RESOLVED' as any, resolvedAt: new Date() },
    });
  }

  async getMessages(ticketId: string) {
    return this.prisma.supportMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
