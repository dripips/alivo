import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import * as webpush from 'web-push';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private initialized = false;

  constructor(private prisma: PrismaService) {}

  /**
   * Initialize VAPID details from stored settings or env vars.
   * Called lazily before any push operation.
   */
  private async ensureVapid() {
    if (this.initialized) return;

    const settings = await this.prisma.appSetting.findMany({
      where: { key: { in: ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_EMAIL'] } },
    });

    const map = new Map(settings.map((s) => [s.key, s.value]));
    const publicKey = map.get('VAPID_PUBLIC_KEY') ?? process.env.VAPID_PUBLIC_KEY;
    const privateKey = map.get('VAPID_PRIVATE_KEY') ?? process.env.VAPID_PRIVATE_KEY;
    const email = map.get('VAPID_EMAIL') ?? process.env.VAPID_EMAIL ?? 'mailto:admin@example.com';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(email, publicKey, privateKey);
      this.initialized = true;
    }
  }

  /**
   * Generate a new VAPID key pair and store in AppSetting.
   */
  async generateVapidKeys() {
    const keys = webpush.generateVAPIDKeys();

    await Promise.all([
      this.prisma.appSetting.upsert({
        where: { key: 'VAPID_PUBLIC_KEY' },
        update: { value: keys.publicKey },
        create: { key: 'VAPID_PUBLIC_KEY', value: keys.publicKey },
      }),
      this.prisma.appSetting.upsert({
        where: { key: 'VAPID_PRIVATE_KEY' },
        update: { value: keys.privateKey },
        create: { key: 'VAPID_PRIVATE_KEY', value: keys.privateKey },
      }),
    ]);

    this.initialized = false; // Force re-initialization with new keys

    return { publicKey: keys.publicKey };
  }

  /**
   * Return the VAPID public key for the client to use when subscribing.
   */
  async getPublicKey(): Promise<string | null> {
    const setting = await this.prisma.appSetting.findUnique({
      where: { key: 'VAPID_PUBLIC_KEY' },
    });
    return setting?.value ?? process.env.VAPID_PUBLIC_KEY ?? null;
  }

  /**
   * Save a push subscription for a user.
   */
  async subscribe(
    userId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    return this.prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId,
          endpoint: subscription.endpoint,
        },
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
  }

  /**
   * Remove a push subscription by endpoint.
   */
  async unsubscribe(userId: string, endpoint: string) {
    const sub = await this.prisma.pushSubscription.findUnique({
      where: {
        userId_endpoint: { userId, endpoint },
      },
    });

    if (sub) {
      await this.prisma.pushSubscription.delete({
        where: { id: sub.id },
      });
    }

    return { removed: !!sub };
  }

  /**
   * Send a web push notification to all subscriptions of a user.
   */
  async sendNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    await this.ensureVapid();

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const payload = JSON.stringify({
      title,
      body,
      data: data ?? {},
      timestamp: Date.now(),
    });

    let sent = 0;
    let failed = 0;

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
          );
          sent++;
        } catch (error: any) {
          failed++;
          this.logger.warn(
            `Push failed for subscription ${sub.id}: ${error.message}`,
          );

          // Remove expired or invalid subscriptions (status 410 Gone)
          if (error.statusCode === 410 || error.statusCode === 404) {
            await this.prisma.pushSubscription.delete({
              where: { id: sub.id },
            }).catch(() => {});
          }
        }
      }),
    );

    return { sent, failed };
  }

  /**
   * Send a notification to all guardians of a specific ward.
   */
  async broadcastToGuardians(
    wardId: string,
    title: string,
    body: string,
  ) {
    const relations = await this.prisma.guardianWard.findMany({
      where: { wardId },
      select: { guardianId: true },
    });

    const results = await Promise.all(
      relations.map((r) => this.sendNotification(r.guardianId, title, body)),
    );

    return {
      guardiansNotified: relations.length,
      totalSent: results.reduce((sum, r) => sum + r.sent, 0),
      totalFailed: results.reduce((sum, r) => sum + r.failed, 0),
    };
  }
}
