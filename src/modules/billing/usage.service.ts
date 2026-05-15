import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class UsageService {
  constructor(private prisma: PrismaService) {}

  async track(userId: string, type: string, metadata?: any) {
    return this.prisma.usageLog.create({
      data: { userId, type, metadata },
    });
  }

  async checkQuota(userId: string, type: string): Promise<boolean> {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    const limit = sub?.plan?.aiMessagesMonth ?? 50; // free default
    if (limit === -1) return true;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await this.prisma.usageLog.count({
      where: {
        userId,
        type,
        createdAt: { gte: startOfMonth },
      },
    });

    return usage < limit;
  }

  async enforceQuota(userId: string, type: string) {
    const allowed = await this.checkQuota(userId, type);
    if (!allowed) {
      throw new ForbiddenException(
        'Monthly usage limit reached. Upgrade your plan for more.',
      );
    }
  }

  async getUsageSummary(userId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [aiMessages, checkIns, sosAlerts, fraudAlerts] = await Promise.all([
      this.prisma.usageLog.count({
        where: { userId, type: 'ai_message', createdAt: { gte: startOfMonth } },
      }),
      this.prisma.usageLog.count({
        where: { userId, type: 'checkin', createdAt: { gte: startOfMonth } },
      }),
      this.prisma.usageLog.count({
        where: { userId, type: 'sos', createdAt: { gte: startOfMonth } },
      }),
      this.prisma.usageLog.count({
        where: { userId, type: 'fraud_alert', createdAt: { gte: startOfMonth } },
      }),
    ]);

    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    const limit = sub?.plan?.aiMessagesMonth ?? 50;

    return {
      period: startOfMonth.toISOString().slice(0, 7),
      aiMessages: { used: aiMessages, limit: limit === -1 ? 'unlimited' : limit },
      checkIns,
      sosAlerts,
      fraudAlerts,
      plan: sub?.plan?.tier ?? 'FREE',
    };
  }
}
