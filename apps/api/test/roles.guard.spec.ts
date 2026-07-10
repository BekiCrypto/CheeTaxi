import { RolesGuard } from '../src/common/guards/roles.guard';
import { RoleService } from '../src/common/services/role.service';
import { Reflector } from '@nestjs/core';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let roleServiceMock: any;
  let reflectorMock: any;

  beforeEach(() => {
    reflectorMock = {
      getAllAndOverride: jest.fn(),
    };
    roleServiceMock = {
      userHasAnyRole: jest.fn(),
    };
    guard = new RolesGuard(reflectorMock as unknown as Reflector, roleServiceMock);
  });

  it('returns true when no roles are required', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(undefined);
    const ctx: any = {
      switchToHttp: () => ({ getRequest: () => ({ user: { id: 'u1' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
    expect(await guard.canActivate(ctx)).toBe(true);
    expect(roleServiceMock.userHasAnyRole).not.toHaveBeenCalled();
  });

  it('returns true when user has required role', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(['SUPER_ADMIN']);
    roleServiceMock.userHasAnyRole.mockResolvedValue(true);
    const ctx: any = {
      switchToHttp: () => ({ getRequest: () => ({ user: { id: 'u1' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
    expect(await guard.canActivate(ctx)).toBe(true);
    expect(roleServiceMock.userHasAnyRole).toHaveBeenCalledWith('u1', ['SUPER_ADMIN']);
  });

  it('throws ForbiddenException when user lacks required role', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(['SUPER_ADMIN']);
    roleServiceMock.userHasAnyRole.mockResolvedValue(false);
    const ctx: any = {
      switchToHttp: () => ({ getRequest: () => ({ user: { id: 'u1' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
    await expect(guard.canActivate(ctx)).rejects.toThrow(/Requires one of roles/);
  });

  it('throws ForbiddenException when no user is present', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(['SUPER_ADMIN']);
    const ctx: any = {
      switchToHttp: () => ({ getRequest: () => ({}) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
    await expect(guard.canActivate(ctx)).rejects.toThrow(/Authentication required/);
  });
});
