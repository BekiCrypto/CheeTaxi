import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.service';

const ROLE_CACHE_TTL = 60; // 1 minute

@Injectable()
export class RoleService {
  private readonly logger = new Logger('RoleService');

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /** Get all roles + permissions for a user. Cached in Redis for 60s. */
  async getUserAccess(userId: string): Promise<{
    roles: string[];
    permissions: string[];
  }> {
    const cacheKey = `user:access:${userId}`;
    const cached = await this.redis.get<{ roles: string[]; permissions: string[] }>(cacheKey);
    if (cached) return cached;

    const [roleAssignments, permissionAssignments] = await Promise.all([
      this.prisma.userRoleAssignment.findMany({ where: { userId } }),
      this.prisma.userPermission.findMany({ where: { userId, granted: true } }),
    ]);

    const result = {
      roles: roleAssignments.map((r) => (r.scope ? `${r.role}:${r.scope}` : r.role)),
      permissions: permissionAssignments.map((p) =>
        p.resource ? `${p.permission}:${p.resource}` : p.permission,
      ),
    };

    await this.redis.set(cacheKey, result, ROLE_CACHE_TTL);
    return result;
  }

  async userHasAnyRole(userId: string, roles: string[]): Promise<boolean> {
    const { roles: userRoles } = await this.getUserAccess(userId);
    return roles.some((r) => userRoles.includes(r) || userRoles.some((ur) => ur.startsWith(`${r}:`)));
  }

  async userHasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    const { permissions: userPerms } = await this.getUserAccess(userId);
    return permissions.some((p) => userPerms.includes(p) || userPerms.some((up) => up.startsWith(`${p}:`)));
  }

  async grantRole(userId: string, role: string, scope?: string, grantedBy?: string): Promise<void> {
    await this.prisma.userRoleAssignment.upsert({
      where: { userId_role_scope: { userId, role: role as any, scope: (scope ?? null) as any } },
      update: {},
      create: { userId, role: role as any, scope, grantedBy },
    });
    await this.invalidate(userId);
  }

  async revokeRole(userId: string, role: string, scope?: string): Promise<void> {
    await this.prisma.userRoleAssignment.deleteMany({
      where: { userId, role: role as any, scope: scope ?? null },
    });
    await this.invalidate(userId);
  }

  async grantPermission(
    userId: string,
    permission: string,
    resource?: string,
    resourceId?: string,
    grantedBy?: string,
  ): Promise<void> {
    await this.prisma.userPermission.upsert({
      where: {
        userId_permission_resource_resourceId: {
          userId,
          permission,
          resource: (resource ?? null) as any,
          resourceId: (resourceId ?? null) as any,
        },
      },
      update: { granted: true, grantedBy },
      create: { userId, permission, resource, resourceId, granted: true, grantedBy },
    });
    await this.invalidate(userId);
  }

  async invalidate(userId: string): Promise<void> {
    await this.redis.del(`user:access:${userId}`);
  }
}
