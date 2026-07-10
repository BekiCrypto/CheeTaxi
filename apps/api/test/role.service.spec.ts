import { RoleService } from '../src/common/services/role.service';
import { PrismaService } from '../src/common/prisma.service';
import { RedisService } from '../src/common/redis.service';

describe('RoleService', () => {
  let service: RoleService;
  let prismaMock: any;
  let redisMock: any;

  beforeEach(() => {
    prismaMock = {
      userRoleAssignment: { findMany: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
      userPermission: { findMany: jest.fn(), upsert: jest.fn() },
    };
    redisMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    service = new RoleService(prismaMock as PrismaService, redisMock as RedisService);
  });

  describe('getUserAccess', () => {
    it('returns cached access when available', async () => {
      redisMock.get.mockResolvedValue({
        roles: ['SUPER_ADMIN'], permissions: ['*'],
      });
      const result = await service.getUserAccess('u1');
      expect(result.roles).toEqual(['SUPER_ADMIN']);
      expect(prismaMock.userRoleAssignment.findMany).not.toHaveBeenCalled();
    });

    it('queries database and caches result when no cache', async () => {
      redisMock.get.mockResolvedValue(null);
      prismaMock.userRoleAssignment.findMany.mockResolvedValue([
        { role: 'OPERATIONS', scope: 'city:addis_ababa' },
      ]);
      prismaMock.userPermission.findMany.mockResolvedValue([
        { permission: 'trips', resource: 'read' },
      ]);
      const result = await service.getUserAccess('u1');
      expect(result.roles).toEqual(['OPERATIONS:city:addis_ababa']);
      expect(result.permissions).toEqual(['trips:read']);
      expect(redisMock.set).toHaveBeenCalled();
    });
  });

  describe('userHasAnyRole', () => {
    it('returns true when user has the role directly', async () => {
      jest.spyOn(service, 'getUserAccess').mockResolvedValue({
        roles: ['SUPER_ADMIN'], permissions: [],
      });
      expect(await service.userHasAnyRole('u1', ['SUPER_ADMIN'])).toBe(true);
    });

    it('returns true when user has a scoped version of the role', async () => {
      jest.spyOn(service, 'getUserAccess').mockResolvedValue({
        roles: ['OPERATIONS:city:addis_ababa'], permissions: [],
      });
      expect(await service.userHasAnyRole('u1', ['OPERATIONS'])).toBe(true);
    });

    it('returns false when user lacks the role', async () => {
      jest.spyOn(service, 'getUserAccess').mockResolvedValue({
        roles: ['PASSENGER'], permissions: [],
      });
      expect(await service.userHasAnyRole('u1', ['SUPER_ADMIN'])).toBe(false);
    });
  });

  describe('grantRole', () => {
    it('upserts role and invalidates cache', async () => {
      prismaMock.userRoleAssignment.upsert.mockResolvedValue({});
      await service.grantRole('u1', 'OPERATIONS', 'city:addis_ababa', 'admin-u1');
      expect(prismaMock.userRoleAssignment.upsert).toHaveBeenCalled();
      expect(redisMock.del).toHaveBeenCalledWith('user:access:u1');
    });
  });

  describe('revokeRole', () => {
    it('deletes role and invalidates cache', async () => {
      prismaMock.userRoleAssignment.deleteMany.mockResolvedValue({ count: 1 });
      await service.revokeRole('u1', 'OPERATIONS', 'city:addis_ababa');
      expect(redisMock.del).toHaveBeenCalledWith('user:access:u1');
    });
  });
});
