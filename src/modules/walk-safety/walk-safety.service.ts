import { Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../common/prisma.service';
import { ChannelRouter } from '../channels/channel.router';
import { ContactsService } from '../contacts/contacts.service';

@Injectable()
export class WalkSafetyService {
  private readonly logger = new Logger(WalkSafetyService.name);

  constructor(
    private prisma: PrismaService,
    private channels: ChannelRouter,
    private contacts: ContactsService,
    private i18n: I18nService,
  ) {}

  async startWalk(userId: string, data: {
    expectedMinutes: number;
    latitude?: number;
    longitude?: number;
  }) {
    const expectedBack = new Date(Date.now() + data.expectedMinutes * 60000);

    return this.prisma.walkSession.create({
      data: {
        userId,
        expectedBack,
        lastLatitude: data.latitude,
        lastLongitude: data.longitude,
        lastPingAt: new Date(),
      },
    });
  }

  async pingLocation(sessionId: string, latitude: number, longitude: number) {
    return this.prisma.walkSession.update({
      where: { id: sessionId },
      data: { lastLatitude: latitude, lastLongitude: longitude, lastPingAt: new Date() },
    });
  }

  async endWalk(userId: string, sessionId: string) {
    return this.prisma.walkSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    });
  }

  async getActiveWalk(userId: string) {
    return this.prisma.walkSession.findFirst({
      where: { userId, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });
  }

  async checkOverdueWalks() {
    const overdue = await this.prisma.walkSession.findMany({
      where: {
        endedAt: null,
        isAlerted: false,
        expectedBack: { lt: new Date() },
      },
      include: { user: true },
    });

    for (const walk of overdue) {
      await this.alertOverdueWalk(walk);
    }
  }

  private async alertOverdueWalk(walk: any) {
    const user = walk.user;
    const minutesOverdue = Math.floor(
      (Date.now() - walk.expectedBack.getTime()) / 60000,
    );

    let locationText = '';
    if (walk.lastLatitude && walk.lastLongitude) {
      locationText = `\n📍 Last known: https://maps.google.com/maps?q=${walk.lastLatitude},${walk.lastLongitude}`;
    }

    const { emergencyContacts, guardians } =
      await this.contacts.getContactsForAlert(user.id);

    const alertText = String(this.i18n.t('walk.overdue_alert', {
      lang: user.locale,
      args: {
        wardName: user.name,
        minutes: minutesOverdue,
        location: locationText,
      },
    }));

    const targets: Array<{ type: string; externalId: string }> = [];
    for (const g of guardians) {
      for (const ch of (g as any).channels || []) {
        targets.push({ type: ch.type, externalId: ch.externalId });
      }
    }
    for (const c of emergencyContacts) {
      if (c.channel && c.channelId) {
        targets.push({ type: c.channel, externalId: c.channelId });
      }
    }

    await this.channels.broadcast(targets, alertText);

    await this.prisma.walkSession.update({
      where: { id: walk.id },
      data: { isAlerted: true },
    });

    this.logger.warn(`Walk overdue alert for ${user.name} (${minutesOverdue} min)`);
  }
}
