import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RoleService } from '../common/services/role.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private roleService: RoleService,
  ) {}

  async list(options: { page: number; limit: number; search?: string; role?: string }) {
    const { page, limit, search, role } = options;
    const where = {
      ...(role ? { role: role as any } : {}),
      ...(search
        ? {
            OR: [
              { phone: { contains: search } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          publicId: true,
          phone: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          country: true,
          city: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items: users, total, page, limit };
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: true,
        permissions: true,
        passenger: true,
        driver: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    avatarUrl?: string;
    preferredLanguage?: string;
    city?: string;
    gender?: string;
  }) {
    return this.prisma.user.update({
      where: { id },
      data: data as any,
    });
  }

  async setStatus(id: string, status: string, reason?: string) {
    const update = status === 'SUSPENDED' || status === 'BANNED'
      ? { status: status as any, deletedAt: status === 'BANNED' ? new Date() : null }
      : { status: status as any };
    return this.prisma.user.update({ where: { id }, data: update });
  }

  async assignRole(userId: string, role: string, scope: string | undefined, grantedBy: string) {
    await this.roleService.grantRole(userId, role, scope, grantedBy);
    return this.roleService.getUserAccess(userId);
  }

  async revokeRole(userId: string, role: string, scope: string | undefined) {
    await this.roleService.revokeRole(userId, role, scope);
    return this.roleService.getUserAccess(userId);
  }

  async deleteAccount(userId: string) {
    // Soft delete per GDPR
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'INACTIVE',
        deletedAt: new Date(),
        phone: `deleted-${userId}`,
        email: null,
        passwordHash: null,
      },
    });
    return { message: 'Account scheduled for deletion' };
  }
}
