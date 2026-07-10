import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

/**
 * Data residency compliance — ensures user data is stored and processed
 * in compliance with each country's data protection laws.
 *
 * Rules:
 *   • Ethiopia: PII must stay in af-south-1 (Cape Town) — closest AWS region
 *     that complies with Ethiopian Data Protection Proclamation
 *   • Kenya: PII must stay in af-south-1
 *   • Nigeria: PII must stay in af-south-1 (NDPA compliance)
 *   • EU users: GDPR — data must stay in eu-central-1 or eu-west-1
 *
 * This service is consulted before any data write to determine the correct
 * storage region. In a multi-region deployment, the API gateway routes
 * requests to the correct regional cluster based on the user's country.
 */
@Injectable()
export class ComplianceService {
  private readonly logger = new Logger('ComplianceService');

  // Default rules — can be overridden via the DataResidencyRule table
  private readonly DEFAULT_RULES: Record<string, { storageRegion: string; replicationAllowed: boolean }> = {
    ETHIOPIA: { storageRegion: 'af-south-1', replicationAllowed: false },
    KENYA: { storageRegion: 'af-south-1', replicationAllowed: false },
    NIGERIA: { storageRegion: 'af-south-1', replicationAllowed: false },
    GHANA: { storageRegion: 'af-south-1', replicationAllowed: false },
    SOUTH_AFRICA: { storageRegion: 'af-south-1', replicationAllowed: true },
    EGYPT: { storageRegion: 'af-south-1', replicationAllowed: false },
    MOROCCO: { storageRegion: 'af-south-1', replicationAllowed: false },
    RWANDA: { storageRegion: 'af-south-1', replicationAllowed: false },
    TANZANIA: { storageRegion: 'af-south-1', replicationAllowed: false },
    UGANDA: { storageRegion: 'af-south-1', replicationAllowed: false },
    SENEGAL: { storageRegion: 'af-south-1', replicationAllowed: false },
    IVORY_COAST: { storageRegion: 'af-south-1', replicationAllowed: false },
    OTHER: { storageRegion: 'eu-central-1', replicationAllowed: true },
  };

  constructor(private prisma: PrismaService) {}

  /** Get the required storage region for a country + data type. */
  async getStorageRegion(country: string, dataType: string): Promise<string> {
    // Check for a custom rule in the DB
    const rule = await this.prisma.dataResidencyRule.findUnique({
      where: { country_dataType: { country: country as any, dataType } },
    });

    if (rule) {
      return rule.storageRegion;
    }

    // Fall back to defaults
    const defaultRule = this.DEFAULT_RULES[country] ?? this.DEFAULT_RULES.OTHER;
    return defaultRule.storageRegion;
  }

  /** Check if data replication is allowed for a country + data type. */
  async isReplicationAllowed(country: string, dataType: string): Promise<boolean> {
    const rule = await this.prisma.dataResidencyRule.findUnique({
      where: { country_dataType: { country: country as any, dataType } },
    });
    if (rule) return rule.replicationAllowed;

    const defaultRule = this.DEFAULT_RULES[country] ?? this.DEFAULT_RULES.OTHER;
    return defaultRule.replicationAllowed;
  }

  /** Get the retention period (in days) for a country + data type. */
  async getRetentionDays(country: string, dataType: string): Promise<number> {
    const rule = await this.prisma.dataResidencyRule.findUnique({
      where: { country_dataType: { country: country as any, dataType } },
    });
    return rule?.retentionDays ?? 2555; // 7 years default
  }

  /** Validate that a data write complies with residency rules. */
  async validateWrite(country: string, dataType: string, targetRegion: string): Promise<void> {
    const requiredRegion = await this.getStorageRegion(country, dataType);
    if (targetRegion !== requiredRegion) {
      throw new BadRequestException(
        `Data residency violation: ${dataType} for ${country} must be stored in ${requiredRegion}, not ${targetRegion}`,
      );
    }
  }

  /** List all residency rules (admin view). */
  async listRules() {
    const rules = await this.prisma.dataResidencyRule.findMany({
      orderBy: [{ country: 'asc' }, { dataType: 'asc' }],
    });
    // Merge with defaults
    const allCountries = Array.from(new Set([
      ...Object.keys(this.DEFAULT_RULES),
      ...rules.map((r) => r.country),
    ]));
    const allDataTypes = ['pii', 'financial', 'health', 'biometric', 'trip_data'];

    const result: any[] = [];
    for (const country of allCountries) {
      for (const dataType of allDataTypes) {
        const rule = rules.find((r) => r.country === country && r.dataType === dataType);
        const defaultRule = this.DEFAULT_RULES[country] ?? this.DEFAULT_RULES.OTHER;
        result.push({
          country,
          dataType,
          storageRegion: rule?.storageRegion ?? defaultRule.storageRegion,
          replicationAllowed: rule?.replicationAllowed ?? defaultRule.replicationAllowed,
          encryptionRequired: rule?.encryptionRequired ?? true,
          retentionDays: rule?.retentionDays ?? 2555,
          regulatoryBody: rule?.regulatoryBody,
          isCustom: !!rule,
        });
      }
    }
    return result;
  }

  /** Create or update a residency rule. */
  async upsertRule(data: {
    country: string; dataType: string; storageRegion: string;
    replicationAllowed?: boolean; encryptionRequired?: boolean;
    retentionDays?: number; regulatoryBody?: string; notes?: string;
  }) {
    return this.prisma.dataResidencyRule.upsert({
      where: { country_dataType: { country: data.country as any, dataType: data.dataType } },
      update: {
        storageRegion: data.storageRegion,
        replicationAllowed: data.replicationAllowed ?? false,
        encryptionRequired: data.encryptionRequired ?? true,
        retentionDays: data.retentionDays ?? 2555,
        regulatoryBody: data.regulatoryBody,
        notes: data.notes,
      },
      create: {
        country: data.country as any,
        dataType: data.dataType,
        storageRegion: data.storageRegion,
        replicationAllowed: data.replicationAllowed ?? false,
        encryptionRequired: data.encryptionRequired ?? true,
        retentionDays: data.retentionDays ?? 2555,
        regulatoryBody: data.regulatoryBody,
        notes: data.notes,
      },
    });
  }

  /** GDPR right to erasure — delete all data for a user. */
  async deleteUserdata(userId: string): Promise<{ deleted: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.$transaction([
      this.prisma.notification.deleteMany({ where: { userId } }),
      this.prisma.supportMessage.deleteMany({ where: { senderId: userId } }),
      this.prisma.auditLog.deleteMany({ where: { actorUserId: userId } }),
      this.prisma.userSession.deleteMany({ where: { userId } }),
      this.prisma.userDevice.deleteMany({ where: { userId } }),
      this.prisma.userRoleAssignment.deleteMany({ where: { userId } }),
      this.prisma.userPermission.deleteMany({ where: { userId } }),
      this.prisma.walletTransaction.deleteMany({ where: { userId } }),
      this.prisma.billPayment.deleteMany({ where: { userId } }),
      this.prisma.insuranceClaim.deleteMany({ where: { userId } }),
      this.prisma.loyaltyTransaction.deleteMany({ where: { account: { userId } } }),
      this.prisma.loyaltyRedemption.deleteMany({ where: { account: { userId } } }),
      this.prisma.loyaltyAccount.deleteMany({ where: { userId } }),
      // Soft-delete the user record (anonymize PII)
      this.prisma.user.update({
        where: { id: userId },
        data: {
          status: 'INACTIVE',
          deletedAt: new Date(),
          phone: `deleted-${userId}`,
          email: null,
          firstName: 'Deleted',
          lastName: 'User',
          passwordHash: null,
          avatarUrl: null,
        },
      }),
    ]);

    this.logger.log(`GDPR erasure completed for user ${userId}`);
    return { deleted: true };
  }

  /** GDPR right to portability — export all user data as JSON. */
  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        passenger: { include: { savedPlaces: true, favoriteDrivers: true, trips: true } },
        driver: { include: { vehicles: true, trips: true } },
        roles: true,
        permissions: true,
        notifications: { take: 100, orderBy: { createdAt: 'desc' } },
        wallet: { include: { transactions: { take: 100, orderBy: { createdAt: 'desc' } } } },
        subscriptions: { include: { plan: true } },
        auditLogs: { take: 100, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      },
      passenger: user.passenger,
      driver: user.driver,
      roles: user.roles,
      wallet: user.wallet,
      subscriptions: user.subscriptions,
      notifications: user.notifications,
      auditLogs: user.auditLogs,
    };
  }
}
