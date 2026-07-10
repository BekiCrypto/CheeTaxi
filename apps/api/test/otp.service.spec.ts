import { OtpService } from '../src/auth/otp.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../src/common/redis.service';

describe('OtpService', () => {
  let service: OtpService;
  let redisMock: any;
  let configMock: any;

  beforeEach(() => {
    redisMock = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(1),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(undefined),
    };
    configMock = {
      get: jest.fn((key: string) => {
        const map: Record<string, string> = {
          SMS_PROVIDER: 'console',
          BRAND_NAME: 'CheeTaxi',
        };
        return map[key];
      }),
    } as unknown as ConfigService;
    service = new OtpService(redisMock as RedisService, configMock);
  });

  describe('sendOtp', () => {
    it('generates and stores a 6-digit code in Redis', async () => {
      const result = await service.sendOtp('+251911223344', 'login');
      expect(result).toEqual({ sent: true });
      expect(redisMock.set).toHaveBeenCalledTimes(2);
      // First call stores the OTP
      const firstCall = redisMock.set.mock.calls[0];
      expect(firstCall[0]).toBe('otp:login:+251911223344');
      const stored = firstCall[1];
      expect(stored.code).toMatch(/^\d{6}$/);
      expect(firstCall[2]).toBe(300); // 5 min TTL
    });

    it('enforces resend cooldown', async () => {
      redisMock.get.mockResolvedValueOnce('1'); // cooldown active
      await expect(service.sendOtp('+251911223344', 'login')).rejects.toThrow(
        /wait 60s/i,
      );
    });

    it('rate-limits after 10 requests per hour', async () => {
      redisMock.incr.mockResolvedValueOnce(11);
      await expect(service.sendOtp('+251911223344', 'login')).rejects.toThrow(
        /Too many OTP requests/i,
      );
    });
  });

  describe('verifyOtp', () => {
    it('returns true for correct code', async () => {
      redisMock.get.mockResolvedValueOnce({ code: '123456', attempts: 0 });
      const ok = await service.verifyOtp('+251911223344', '123456');
      expect(ok).toBe(true);
      expect(redisMock.del).toHaveBeenCalledWith('otp:login:+251911223344');
    });

    it('throws on invalid code and increments attempts', async () => {
      redisMock.get.mockResolvedValueOnce({ code: '123456', attempts: 0 });
      await expect(service.verifyOtp('+251911223344', '000000')).rejects.toThrow(/Invalid OTP/i);
      // The failed attempt should re-store with attempts: 1
      expect(redisMock.set).toHaveBeenCalledWith(
        'otp:login:+251911223344',
        { code: '123456', attempts: 1 },
        300,
      );
    });

    it('throws if no OTP was requested', async () => {
      redisMock.get.mockResolvedValueOnce(null);
      await expect(service.verifyOtp('+251911223344', '123456')).rejects.toThrow(
        /OTP expired or not requested/i,
      );
    });

    it('locks out after 5 failed attempts', async () => {
      redisMock.get.mockResolvedValueOnce({ code: '123456', attempts: 5 });
      await expect(service.verifyOtp('+251911223344', '000000')).rejects.toThrow(
        /Too many failed attempts/i,
      );
      expect(redisMock.del).toHaveBeenCalledWith('otp:login:+251911223344');
    });
  });
});
