import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { RoleService } from '../src/common/services/role.service';
import { Reflector } from '@nestjs/core';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let roleServiceMock: any;
  let reflectorMock: any;

  beforeEach(() => {
    reflectorMock = { getAllAndOverride: jest.fn() };
    roleServiceMock = { userHasAnyPermission: jest.fn() };
    guard = new PermissionsGuard(reflectorMock as unknown as Reflector, roleServiceMock);
  });

  it('returns true when no permissions are required', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(undefined);
    const ctx: any = {
      switchToHttp: () => ({ getRequest: () => ({ user: { id: 'u1' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('returns true when user has required permission', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(['drivers:approve']);
    roleServiceMock.userHasAnyPermission.mockResolvedValue(true);
    const ctx: any = {
      switchToHttp: () => ({ getRequest: () => ({ user: { id: 'u1' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
    expect(await guard.canActivate(ctx)).toBe(true);
    expect(roleServiceMock.userHasAnyPermission).toHaveBeenCalledWith('u1', ['drivers:approve']);
  });

  it('throws ForbiddenException when user lacks permission', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(['subscriptions:refund']);
    roleServiceMock.userHasAnyPermission.mockResolvedValue(false);
    const ctx: any = {
      switchToHttp: () => ({ getRequest: () => ({ user: { id: 'u1' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
    await expect(guard.canActivate(ctx)).rejects.toThrow(/permission/i);
  });
});
