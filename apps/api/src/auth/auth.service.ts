import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { OtpService } from './otp.service';
import { SignupDto, LoginDto, OtpVerifyDto, RefreshTokenDto, LogoutDto } from './dto';

const REFRESH_TTL_DAYS = 30;
const REFRESH_TTL_SECONDS = REFRESH_TTL_DAYS * 24 * 60 * 60;

interface JwtPayload {
  sub: string;       // userId
  phone: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private redis: RedisService,
    private otp: OtpService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ phone: dto.phone }, ...(dto.email ? [{ email: dto.email }] : [])] },
    });
    if (existing) throw new ConflictException('User already exists with this phone or email');

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 12) : null;
    const role = (dto.role ?? 'PASSENGER') as any;

    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role,
        status: role === 'DRIVER' ? 'PENDING_VERIFICATION' : 'ACTIVE',
        phoneVerified: false,
        referralCode: `CHEE-${nanoid(8).toUpperCase()}`,
      },
    });

    await this.prisma.userRoleAssignment.create({
      data: { userId: user.id, role, grantedBy: 'system' },
    });

    if (role === 'PASSENGER') {
      await this.prisma.passenger.create({ data: { userId: user.id } });
    } else if (role === 'DRIVER') {
      await this.prisma.driver.create({ data: { userId: user.id, licenseNumber: `PENDING-${user.id}`, licenseExpiry: new Date(Date.now() + 365 * 24 * 3600 * 1000), licenseFrontUrl: 'pending' } });
    }

    // Referral accounting
    if (dto.referralCode) {
      const referrer = await this.prisma.user.findUnique({ where: { referralCode: dto.referralCode } });
      if (referrer && referrer.id !== user.id) {
        await this.prisma.referral.create({
          data: {
            referrerUserId: referrer.id,
            referredUserId: user.id,
            status: 'pending',
          },
        });
      }
    }

    // Issue OTP for phone verification
    await this.otp.sendOtp(dto.phone, 'signup');

    return { userId: user.id, message: 'Account created. Verify your phone with the OTP sent.' };
  }

  async login(dto: LoginDto) {
    const user = await this.findUserByIdentifier(dto.identifier);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase()}`);
    }
    const valid = await bcrypt.compare(dto.password ?? '', user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(user);
  }

  async requestOtp(dto: { phone: string; purpose?: string }) {
    await this.otp.sendOtp(dto.phone, dto.purpose ?? 'login');
    return { message: 'OTP sent' };
  }

  async verifyOtp(dto: OtpVerifyDto) {
    const valid = await this.otp.verifyOtp(dto.phone, dto.code);
    if (!valid) throw new UnauthorizedException('Invalid or expired OTP');

    let user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) {
      // Auto-create passenger account on first OTP verify
      user = await this.prisma.user.create({
        data: {
          phone: dto.phone,
          firstName: dto.firstName ?? 'Guest',
          lastName: dto.lastName ?? 'User',
          role: 'PASSENGER',
          status: 'ACTIVE',
          phoneVerified: true,
          referralCode: `CHEE-${nanoid(8).toUpperCase()}`,
        },
      });
      await this.prisma.userRoleAssignment.create({
        data: { userId: user.id, role: 'PASSENGER', grantedBy: 'system' },
      });
      await this.prisma.passenger.create({ data: { userId: user.id, isGuest: !dto.firstName } });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true, lastLoginAt: new Date() },
      });
    }

    return this.issueTokens(user);
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const sessionId = payload.sub;
    const session = await this.prisma.userSession.findFirst({
      where: { id: sessionId, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!session) throw new UnauthorizedException('Session not found or expired');

    const matches = await bcrypt.compare(dto.refreshToken, session.refreshTokenHash);
    if (!matches) throw new UnauthorizedException('Invalid refresh token');

    // Rotate — revoke old session
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.issueTokens(user);
  }

  async logout(dto: LogoutDto) {
    let payload: JwtPayload;
    try {
      payload = this.jwt.decode(dto.refreshToken) as JwtPayload;
    } catch {
      return { message: 'Logged out' };
    }
    if (payload?.sub) {
      await this.prisma.userSession.updateMany({
        where: { id: payload.sub, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { message: 'Logged out' };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        publicId: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        status: true,
        phoneVerified: true,
        emailVerified: true,
        preferredLanguage: true,
        country: true,
        city: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  private async issueTokens(user: { id: string; phone: string; role: string }) {
    const payload: JwtPayload = { sub: user.id, phone: user.phone, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);

    const refreshToken = await this.jwt.signAsync(payload, {
      expiresIn: `${REFRESH_TTL_DAYS}d`,
    });
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const session = await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
      },
    });

    // Embed session id in refresh token for rotation
    const refreshWithSession = `${session.id}.${refreshToken}`;

    return {
      accessToken,
      refreshToken: refreshWithSession,
      expiresIn: 15 * 60,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  private async findUserByIdentifier(identifier: string) {
    return this.prisma.user.findFirst({
      where: { OR: [{ phone: identifier }, { email: identifier }] },
    });
  }
}
