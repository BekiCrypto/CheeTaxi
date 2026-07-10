import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma.service';

/**
 * Firebase Cloud Messaging (FCM) push provider.
 *
 * Initializes `firebase-admin` with service-account credentials from env:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *
 * If credentials are not set, the provider is a no-op (logs a warning) —
 * notifications still get stored in the DB and delivered via WebSocket.
 */

interface FcmMessage {
  token: string;
  notification: { title: string; body: string };
  data?: Record<string, string>;
  android?: { priority: 'high' | 'normal' };
  apns?: { payload: { aps: { sound?: string; badge?: number } } };
}

@Injectable()
export class FcmService {
  private readonly logger = new Logger('FcmService');
  private app: { messaging: () => FcmMessaging } | null = null;
  private initialized = false;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.init();
  }

  private init(): void {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKeyRaw = this.config.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKeyRaw) {
      this.logger.warn('Firebase credentials not set — FCM push will be a no-op. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.');
      return;
    }

    try {
      // Lazy-load firebase-admin so the app doesn't crash if the package
      // is not yet installed during development.
      const admin = require('firebase-admin');
      const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      }, 'cheetaxi-api');
      this.initialized = true;
      this.logger.log('Firebase Cloud Messaging initialized');
    } catch (err) {
      this.logger.warn(`Firebase init failed: ${(err as Error).message}. Run 'pnpm --filter @cheetaxi/api add firebase-admin'.`);
    }
  }

  /** Send a push notification to a specific user (looks up all their device tokens). */
  async sendToUser(userId: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
    if (!this.initialized || !this.app) return;

    const devices = await this.prisma.userDevice.findMany({
      where: { userId, deviceToken: { not: null } },
      select: { deviceToken: true, platform: true },
    });

    if (devices.length === 0) return;

    const messaging = this.app.messaging();
    const messages: FcmMessage[] = devices
      .filter((d): d is typeof d & { deviceToken: string } => d.deviceToken !== null)
      .map((d) => ({
        token: d.deviceToken,
        notification: { title, body },
        data: data ?? {},
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      }));

    // Send in batches of 500 (FCM limit)
    for (let i = 0; i < messages.length; i += 500) {
      const batch = messages.slice(i, i + 500);
      try {
        const response = await messaging.sendEachForMulticast
          ? this.sendEachCompat(messaging, batch)
          : (messaging as any).sendAll(batch);
        if (response.failureCount > 0) {
          this.logger.warn(`FCM partial failure: ${response.failureCount}/${batch.length} failed`);
          await this.handleFailures(batch, response);
        }
      } catch (err) {
        this.logger.error(`FCM send failed: ${(err as Error).message}`);
      }
    }
  }

  /** Register a device token for push notifications. */
  async registerDevice(userId: string, token: string, platform: string, deviceInfo?: Record<string, unknown>): Promise<void> {
    await this.prisma.userDevice.upsert({
      where: { userId_platform_deviceToken: { userId, platform, deviceToken: token } },
      update: { lastSeenAt: new Date() },
      create: {
        userId,
        deviceToken: token,
        platform,
        deviceModel: deviceInfo?.model as string | undefined,
        osVersion: deviceInfo?.osVersion as string | undefined,
        appVersion: deviceInfo?.appVersion as string | undefined,
      },
    });
  }

  /** Unregister a device token (e.g., on logout). */
  async unregisterDevice(userId: string, token: string): Promise<void> {
    await this.prisma.userDevice.deleteMany({
      where: { userId, deviceToken: token },
    });
  }

  private async sendEachCompat(messaging: FcmMessaging, batch: FcmMessage[]): Promise<{ successCount: number; failureCount: number; responses: { success: boolean; error?: { code: number; message: string } }[] }> {
    // Newer SDK uses sendEachForMulticast; older uses sendAll
    if ('sendEachForMulticast' in messaging && typeof (messaging as any).sendEachForMulticast === 'function') {
      return (messaging as any).sendEachForMulticast({
        messages: batch,
      });
    }
    return (messaging as any).sendAll(batch);
  }

  private async handleFailures(batch: FcmMessage[], response: { responses: { success: boolean; error?: { code: number; message: string } }[] }): Promise<void> {
    // Remove invalid tokens (UNREGISTERED, INVALID_ARGUMENT)
    for (let i = 0; i < response.responses.length; i++) {
      const r = response.responses[i];
      if (r && !r.success && r.error) {
        const code = r.error.code;
        // 404 = UNREGISTERED, 400 = INVALID_ARGUMENT
        if (code === 404 || code === 400) {
          await this.prisma.userDevice.deleteMany({
            where: { deviceToken: batch[i]!.token },
          }).catch(() => undefined);
        }
      }
    }
  }
}

interface FcmMessaging {
  sendEachForMulticast?(message: { messages: FcmMessage[] }): Promise<{ successCount: number; failureCount: number; responses: { success: boolean; error?: { code: number; message: string } }[] }>;
  sendAll?(messages: FcmMessage[]): Promise<{ successCount: number; failureCount: number; responses: { success: boolean; error?: { code: number; message: string } }[] }>;
}
