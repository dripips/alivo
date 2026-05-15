import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ChannelRouter } from '../channels/channel.router';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class CheckInService {
  private readonly logger = new Logger(CheckInService.name);

  constructor(
    private prisma: PrismaService,
    private channels: ChannelRouter,
    private i18n: I18nService,
  ) {}

  async createSchedule(userId: string, times: string[], days: string[]) {
    return this.prisma.checkInSchedule.upsert({
      where: { userId },
      update: { times, days, isActive: true },
      create: { userId, times, days },
    });
  }

  async sendCheckIn(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { channels: { where: { isPrimary: true } } },
    });
    if (!user || !user.channels.length) return null;

    const checkIn = await this.prisma.checkIn.create({
      data: { userId, scheduledAt: new Date(), status: 'PENDING' },
    });

    const hour = new Date().getHours();
    let greetingKey = 'checkin.morning_greeting';
    if (hour >= 12 && hour < 17) greetingKey = 'checkin.afternoon_greeting';
    if (hour >= 17) greetingKey = 'checkin.evening_greeting';

    const text = String(this.i18n.t(greetingKey, {
      lang: user.locale,
      args: { name: user.name.split(' ')[0] },
    }));

    const buttons = [
      {
        label: String(this.i18n.t('checkin.buttons.im_ok', { lang: user.locale })),
        callbackData: `checkin:${checkIn.id}:ok`,
      },
      {
        label: String(this.i18n.t('checkin.buttons.not_great', { lang: user.locale })),
        callbackData: `checkin:${checkIn.id}:meh`,
      },
      {
        label: String(this.i18n.t('checkin.buttons.need_talk', { lang: user.locale })),
        callbackData: `checkin:${checkIn.id}:talk`,
      },
      {
        label: String(this.i18n.t('checkin.buttons.help', { lang: user.locale })),
        callbackData: `checkin:${checkIn.id}:help`,
      },
    ];

    for (const channel of user.channels) {
      await this.channels.send(channel.type, {
        externalUserId: channel.externalId,
        text,
        buttons,
      });
    }

    this.logger.log(`Check-in sent to ${user.name} (${checkIn.id})`);
    return checkIn;
  }

  async handleResponse(
    checkInId: string,
    response: string,
    channelType: string,
  ) {
    const moodMap: Record<string, number> = {
      ok: 5,
      meh: 3,
      talk: 2,
      help: 1,
    };

    const checkIn = await this.prisma.checkIn.update({
      where: { id: checkInId },
      data: {
        status: 'RESPONDED',
        respondedAt: new Date(),
        mood: moodMap[response] ?? 3,
        responseText: response,
        channelUsed: channelType as any,
      },
      include: { user: true },
    });

    return checkIn;
  }

  async getHistory(userId: string, limit = 30) {
    return this.prisma.checkIn.findMany({
      where: { userId },
      orderBy: { scheduledAt: 'desc' },
      take: limit,
    });
  }

  async getPendingCheckIns() {
    const threshold = new Date(Date.now() - 30 * 60 * 1000);
    return this.prisma.checkIn.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: { lt: threshold },
      },
      include: {
        user: { include: { channels: true } },
      },
    });
  }

  async getMoodStats(userId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const checkIns = await this.prisma.checkIn.findMany({
      where: {
        userId,
        status: 'RESPONDED',
        respondedAt: { gte: since },
        mood: { not: null },
      },
      orderBy: { respondedAt: 'asc' },
      select: { mood: true, respondedAt: true },
    });

    if (!checkIns.length) return { average: null, trend: 'stable', data: [] };

    const avg =
      checkIns.reduce((sum, c) => sum + (c.mood ?? 0), 0) / checkIns.length;

    const recent = checkIns.slice(-7);
    const older = checkIns.slice(0, Math.max(1, checkIns.length - 7));
    const recentAvg =
      recent.reduce((s, c) => s + (c.mood ?? 0), 0) / recent.length;
    const olderAvg =
      older.reduce((s, c) => s + (c.mood ?? 0), 0) / older.length;

    let trend: string = 'stable';
    if (recentAvg - olderAvg > 0.5) trend = 'improving';
    if (olderAvg - recentAvg > 0.5) trend = 'declining';

    return { average: Math.round(avg * 10) / 10, trend, data: checkIns };
  }
}
