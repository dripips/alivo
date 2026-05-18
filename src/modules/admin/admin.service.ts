import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalWards,
      totalGuardians,
      totalCheckIns,
      totalAiMessages,
      totalMedications,
      totalSosAlerts,
      subscriptionsByTier,
    ] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { role: 'WARD', isActive: true } }),
      this.prisma.user.count({ where: { role: 'GUARDIAN', isActive: true } }),
      this.prisma.checkIn.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      this.prisma.usageLog.count({
        where: { type: 'ai_message', createdAt: { gte: startOfMonth } },
      }),
      this.prisma.medication.count({ where: { isActive: true } }),
      this.prisma.sosAlert.count(),
      this.prisma.subscription.groupBy({
        by: ['planId'],
        where: { status: 'ACTIVE' },
        _count: { id: true },
      }),
    ]);

    // Resolve plan tiers for subscription counts
    const plans = await this.prisma.plan.findMany();
    const planMap = new Map(plans.map((p) => [p.id, p.tier]));

    const activeSubscriptions: Record<string, number> = {};
    for (const group of subscriptionsByTier) {
      const tier = planMap.get(group.planId) ?? 'UNKNOWN';
      activeSubscriptions[tier] = group._count.id;
    }

    return {
      totalUsers,
      totalWards,
      totalGuardians,
      totalCheckIns,
      totalAiMessages,
      totalMedications,
      totalSosAlerts,
      activeSubscriptions,
    };
  }

  async getUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          subscription: {
            select: {
              plan: { select: { tier: true } },
              status: true,
            },
          },
          checkIns: {
            orderBy: { respondedAt: 'desc' },
            where: { respondedAt: { not: null } },
            take: 1,
            select: { respondedAt: true },
          },
        },
      }),
      this.prisma.user.count(),
    ]);

    const items = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      plan: u.subscription?.plan?.tier ?? 'FREE',
      subscriptionStatus: u.subscription?.status ?? null,
      lastActive: u.checkIns[0]?.respondedAt ?? null,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        channels: true,
        medicalProfile: true,
        medications: true,
        checkInSchedule: true,
        emergencyContacts: { orderBy: { priority: 'asc' } },
        subscription: { include: { plan: true } },
        wardsAsGuardian: { include: { ward: true } },
        guardiansAsWard: { include: { guardian: true } },
        usageLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getAiSettings() {
    const keys = ['AI_API_KEY', 'AI_BASE_URL', 'AI_MODEL'];
    const settings = await this.prisma.appSetting.findMany({
      where: { key: { in: keys } },
    });

    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.key === 'AI_API_KEY'
        ? this.maskApiKey(s.value)
        : s.value;
    }

    // Fall back to env vars if no DB settings exist
    return {
      AI_API_KEY: settingsMap['AI_API_KEY'] ?? this.maskApiKey(process.env.AI_API_KEY ?? ''),
      AI_BASE_URL: settingsMap['AI_BASE_URL'] ?? process.env.AI_BASE_URL ?? '',
      AI_MODEL: settingsMap['AI_MODEL'] ?? process.env.AI_MODEL ?? '',
    };
  }

  async updateAiSettings(dto: { AI_API_KEY?: string; AI_BASE_URL?: string; AI_MODEL?: string }) {
    const entries = Object.entries(dto).filter(
      ([, value]) => value !== undefined && value !== null,
    );

    const results = await Promise.all(
      entries.map(([key, value]) =>
        this.prisma.appSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    );

    return { updated: results.length };
  }

  async getAiCostSummary(days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const logs = await this.prisma.usageLog.groupBy({
      by: ['type'],
      where: { createdAt: { gte: since } },
      _count: { id: true },
      _sum: { count: true },
    });

    // Estimate cost based on token counts from metadata
    const aiLogs = await this.prisma.usageLog.findMany({
      where: {
        type: 'ai_message',
        createdAt: { gte: since },
      },
      select: { metadata: true },
    });

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    for (const log of aiLogs) {
      const meta = log.metadata as any;
      if (meta) {
        totalInputTokens += meta.inputTokens ?? meta.input_tokens ?? 0;
        totalOutputTokens += meta.outputTokens ?? meta.output_tokens ?? 0;
      }
    }

    // Cost estimates (per 1M tokens, approximate)
    const inputCostPer1M = 3.0; // USD
    const outputCostPer1M = 15.0; // USD
    const estimatedCost =
      (totalInputTokens / 1_000_000) * inputCostPer1M +
      (totalOutputTokens / 1_000_000) * outputCostPer1M;

    return {
      period: { days, since: since.toISOString() },
      byType: logs.map((l) => ({
        type: l.type,
        count: l._count.id,
        totalUnits: l._sum.count,
      })),
      tokens: {
        input: totalInputTokens,
        output: totalOutputTokens,
      },
      estimatedCostUsd: Math.round(estimatedCost * 100) / 100,
    };
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return { message: 'User deactivated', userId };
  }

  private maskApiKey(key: string): string {
    if (!key || key.length < 8) return '***';
    return key.slice(0, 4) + '***' + key.slice(-4);
  }
}
