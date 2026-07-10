import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/common/prisma.service';
import { RedisService } from '../src/common/redis.service';
import { OtpService } from '../src/auth/otp.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: any;
  let jwtMock: any;
  let redisMock: any;
  let otpMock: any;

  beforeEach(() => {
    prismaMock = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      userRoleAssignment: { create: jest.fn(), upsert: jest.fn() },
      passenger: { create: jest.fn() },
      driver: { create: jest.fn() },
      userSession: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
      referral: { create: jest.fn() },
    };
    jwtMock = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
      sign: jest.fn().mockReturnValue('refresh-token'),
      verify: jest.fn(),
      decode: jest.fn(),
    };
    redisMock = {};
    otpMock = { sendOtp: jest.fn().mockResolvedValue({ sent: true }) };
    service = new AuthService(prismaMock, jwtMock as unknown as JwtService, redisMock as RedisService, otpMock as unknown as OtpService);
  });

  describe('signup', () => {
    it('creates a passenger with hashed password and issues OTP', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'u1', phone: '+251911223344', role: 'PASSENGER',
      });
      prismaMock.userRoleAssignment.create.mockResolvedValue({});
      prismaMock.passenger.create.mockResolvedValue({});

      const result = await service.signup({
        phone: '+251911223344',
        password: 'Password1',
        firstName: 'Abebe',
        lastName: 'Tesfaye',
        role: 'PASSENGER',
      });

      expect(result.userId).toBe('u1');
      expect(otpMock.sendOtp).toHaveBeenCalledWith('+251911223344', 'signup');
      // Verify user was created with hashed password (not plaintext)
      const createCall = prismaMock.user.create.mock.calls[0][0];
      expect(createCall.data.passwordHash).not.toBe('Password1');
      expect(createCall.data.role).toBe('PASSENGER');
      expect(createCall.data.referralCode).toMatch(/^CHEE-/);
    });

    it('throws ConflictException if phone already exists', async () => {
      prismaMock.user.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(
        service.signup({
          phone: '+251911223344',
          firstName: 'Abebe',
          lastName: 'Tesfaye',
        }),
      ).rejects.toThrow(/already exists/i);
    });

    it('creates a driver in PENDING_VERIFICATION status', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'u1', phone: '+251911223344', role: 'DRIVER',
      });
      prismaMock.driver.create.mockResolvedValue({});

      await service.signup({
        phone: '+251911223344',
        firstName: 'Abebe',
        lastName: 'Tesfaye',
        role: 'DRIVER',
      });

      const createCall = prismaMock.user.create.mock.calls[0][0];
      expect(createCall.data.role).toBe('DRIVER');
      expect(createCall.data.status).toBe('PENDING_VERIFICATION');
    });
  });

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('Password1', 10);
      prismaMock.user.findFirst.mockResolvedValue({
        id: 'u1', phone: '+251911223344', passwordHash, role: 'PASSENGER', status: 'ACTIVE',
      });
      prismaMock.user.update.mockResolvedValue({});
      prismaMock.userSession.create.mockResolvedValue({ id: 'session1' });

      const result = await service.login({ identifier: '+251911223344', password: 'Password1' });
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toContain('session1.');
      expect(result.user.phone).toBe('+251911223344');
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const passwordHash = await bcrypt.hash('Password1', 10);
      prismaMock.user.findFirst.mockResolvedValue({
        id: 'u1', phone: '+251911223344', passwordHash, role: 'PASSENGER', status: 'ACTIVE',
      });
      await expect(
        service.login({ identifier: '+251911223344', password: 'wrong' }),
      ).rejects.toThrow(/Invalid credentials/i);
    });

    it('throws for banned user', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        id: 'u1', phone: '+251911223344', passwordHash: 'x', role: 'PASSENGER', status: 'BANNED',
      });
      await expect(
        service.login({ identifier: '+251911223344', password: 'x' }),
      ).rejects.toThrow(/banned/i);
    });
  });

  describe('verifyOtp', () => {
    it('auto-creates a guest passenger for new phone numbers', async () => {
      otpMock.verifyOtp = jest.fn().mockResolvedValue(true);
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'u1', phone: '+251911223344', role: 'PASSENGER',
      });
      prismaMock.userRoleAssignment.create.mockResolvedValue({});
      prismaMock.passenger.create.mockResolvedValue({});
      prismaMock.userSession.create.mockResolvedValue({ id: 's1' });
      jwtMock.signAsync.mockResolvedValue('access-token');
      jwtMock.sign.mockReturnValue('refresh-token');

      const result = await service.verifyOtp({
        phone: '+251911223344',
        code: '123456',
      });
      expect(result.user.phone).toBe('+251911223344');
      const createCall = prismaMock.user.create.mock.calls[0][0];
      expect(createCall.data.phoneVerified).toBe(true);
      expect(createCall.data.role).toBe('PASSENGER');
    });

    it('returns tokens for existing user', async () => {
      otpMock.verifyOtp = jest.fn().mockResolvedValue(true);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1', phone: '+251911223344', role: 'PASSENGER', status: 'ACTIVE',
      });
      prismaMock.user.update.mockResolvedValue({});
      prismaMock.userSession.create.mockResolvedValue({ id: 's1' });
      jwtMock.signAsync.mockResolvedValue('access-token');
      jwtMock.sign.mockReturnValue('refresh-token');

      const result = await service.verifyOtp({ phone: '+251911223344', code: '123456' });
      expect(result.accessToken).toBe('access-token');
      // Should NOT have created a new user
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });
});
