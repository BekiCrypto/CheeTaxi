import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../common/redis.service';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger('OtpService');
  private readonly otpTtlSeconds = 5 * 60; // 5 minutes
  private readonly resendCooldownSeconds = 60;
  private readonly maxAttempts = 5;

  constructor(
    private redis: RedisService,
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async sendOtp(phone: string, purpose: string): Promise<{ sent: boolean }> {
    const cooldownKey = `otp:cooldown:${purpose}:${phone}`;
    const cooldown = await this.redis.get(cooldownKey);
    if (cooldown) {
      throw new UnauthorizedException(`Please wait ${this.resendCooldownSeconds}s before requesting a new OTP`);
    }

    // Rate-limit per phone per hour
    const rateKey = `otp:ratelimit:${phone}`;
    const count = await this.redis.incr(rateKey);
    if (count === 1) await this.redis.expire(rateKey, 3600);
    if (count > 10) {
      throw new UnauthorizedException('Too many OTP requests. Try again later.');
    }

    const code = this.generateCode();
    const storeKey = `otp:${purpose}:${phone}`;
    await this.redis.set(
      storeKey,
      { code, attempts: 0 },
      this.otpTtlSeconds,
    );
    await this.redis.set(cooldownKey, '1', this.resendCooldownSeconds);

    // In production: integrate Twilio / Africa's Talking / Telebur SMS gateway.
    // For dev: log the code.
    if (this.config.get('NODE_ENV') !== 'production') {
      this.logger.log(`[DEV OTP] ${phone} (${purpose}): ${code}`);
    } else {
      // TODO: wire to SMS provider
      this.logger.log(`[PROD] OTP queued for ${phone} (${purpose})`);
    }

    return { sent: true };
  }

  async verifyOtp(phone: string, code: string, purpose = 'login'): Promise<boolean> {
    const storeKey = `otp:${purpose}:${phone}`;
    const stored = await this.redis.get<{ code: string; attempts: number }>(storeKey);
    if (!stored) throw new UnauthorizedException('OTP expired or not requested');

    const newAttempts = stored.attempts + 1;
    if (newAttempts > this.maxAttempts) {
      await this.redis.del(storeKey);
      throw new UnauthorizedException('Too many failed attempts. Request a new OTP.');
    }

    if (stored.code !== code) {
      await this.redis.set(storeKey, { ...stored, attempts: newAttempts }, this.otpTtlSeconds);
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.redis.del(storeKey);
    return true;
  }

  private generateCode(): string {
    // Cryptographically secure 6-digit code
    const buf = new Uint32Array(1);
    require('crypto').webcrypto.getRandomValues(buf);
    return String(buf[0] % 1_000_000).padStart(6, '0');
  }
}
