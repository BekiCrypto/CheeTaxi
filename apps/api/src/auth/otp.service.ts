import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'crypto';
import { RedisService } from '../common/redis.service';

/**
 * Pluggable SMS provider interface. Real providers (Twilio, Africa's Talking,
 * Telebur, MessageBird) implement this and are selected via SMS_PROVIDER env.
 */
interface SmsProvider {
  name: string;
  send(phone: string, body: string): Promise<{ providerRef?: string }>;
}

class ConsoleSmsProvider implements SmsProvider {
  name = 'console';
  constructor(private logger: Logger) {}
  async send(phone: string, body: string) {
    this.logger.log(`[SMS/console] → ${phone}: ${body}`);
    return {};
  }
}

class TwilioSmsProvider implements SmsProvider {
  name = 'twilio';
  private accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID') ?? '';
  private authToken = this.config.get<string>('TWILIO_AUTH_TOKEN') ?? '';
  private from = this.config.get<string>('TWILIO_FROM_NUMBER') ?? '';
  constructor(private config: ConfigService, private logger: Logger) {}
  async send(phone: string, body: string) {
    if (!this.accountSid || !this.authToken || !this.from) {
      throw new Error('Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)');
    }
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: phone, From: this.from, Body: body }).toString(),
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Twilio responded ${res.status}: ${errBody}`);
    }
    const json = (await res.json()) as { sid: string };
    return { providerRef: json.sid };
  }
}

class AfricasTalkingSmsProvider implements SmsProvider {
  name = 'africas_talking';
  private apiKey = this.config.get<string>('AT_API_KEY') ?? '';
  private username = this.config.get<string>('AT_USERNAME') ?? 'sandbox';
  private from = this.config.get<string>('AT_SHORTCODE') ?? '';
  constructor(private config: ConfigService) {}
  async send(phone: string, body: string) {
    if (!this.apiKey) throw new Error('Africa\'s Talking API key not configured (AT_API_KEY)');
    const res = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: { apiKey: this.apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        username: this.username,
        to: phone,
        message: body,
        ...(this.from ? { from: this.from } : {}),
      }).toString(),
    });
    if (!res.ok) throw new Error(`AT responded ${res.status}: ${await res.text()}`);
    return {};
  }
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger('OtpService');
  private readonly otpTtlSeconds = 5 * 60;
  private readonly resendCooldownSeconds = 60;
  private readonly maxAttempts = 5;
  private readonly smsProvider: SmsProvider;
  private readonly brandName: string;

  constructor(
    private redis: RedisService,
    private config: ConfigService,
  ) {
    this.brandName = this.config.get<string>('BRAND_NAME') ?? 'CheeTaxi';
    const providerName = (this.config.get<string>('SMS_PROVIDER') ?? 'console').toLowerCase();
    switch (providerName) {
      case 'twilio':
        this.smsProvider = new TwilioSmsProvider(config, this.logger);
        break;
      case 'africas_talking':
      case 'at':
        this.smsProvider = new AfricasTalkingSmsProvider(config);
        break;
      case 'console':
      default:
        this.smsProvider = new ConsoleSmsProvider(this.logger);
    }
    this.logger.log(`SMS provider: ${this.smsProvider.name}`);
  }

  async sendOtp(phone: string, purpose: string): Promise<{ sent: boolean }> {
    const cooldownKey = `otp:cooldown:${purpose}:${phone}`;
    const cooldown = await this.redis.get(cooldownKey);
    if (cooldown) {
      throw new UnauthorizedException(
        `Please wait ${this.resendCooldownSeconds}s before requesting a new OTP`,
      );
    }

    const rateKey = `otp:ratelimit:${phone}`;
    const count = await this.redis.incr(rateKey);
    if (count === 1) await this.redis.expire(rateKey, 3600);
    if (count > 10) {
      throw new UnauthorizedException('Too many OTP requests. Try again later.');
    }

    const code = this.generateCode();
    const storeKey = `otp:${purpose}:${phone}`;
    await this.redis.set(storeKey, { code, attempts: 0 }, this.otpTtlSeconds);
    await this.redis.set(cooldownKey, '1', this.resendCooldownSeconds);

    const message = `${this.brandName} verification code: ${code}. Valid for 5 minutes. Do not share this code with anyone.`;
    try {
      await this.smsProvider.send(phone, message);
    } catch (err) {
      this.logger.error(`SMS dispatch failed: ${(err as Error).message}`);
      // Do not leak provider errors to client — but mark as not sent
      return { sent: false };
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
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  }
}
