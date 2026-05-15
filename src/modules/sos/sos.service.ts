import { Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../common/prisma.service';
import { ChannelRouter } from '../channels/channel.router';
import { ContactsService } from '../contacts/contacts.service';

@Injectable()
export class SosService {
  private readonly logger = new Logger(SosService.name);

  constructor(
    private prisma: PrismaService,
    private channels: ChannelRouter,
    private contacts: ContactsService,
    private i18n: I18nService,
  ) {}

  async trigger(
    userId: string,
    data: { latitude?: number; longitude?: number; message?: string; channel?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return null;

    const alert = await this.prisma.sosAlert.create({
      data: {
        userId,
        latitude: data.latitude,
        longitude: data.longitude,
        message: data.message,
        channel: data.channel as any,
      },
    });

    const { emergencyContacts, guardians } =
      await this.contacts.getContactsForAlert(userId);

    let locationText = '';
    if (data.latitude && data.longitude) {
      locationText = `\n📍 https://maps.google.com/maps?q=${data.latitude},${data.longitude}`;
    }

    const alertText = String(this.i18n.t('sos.alert_to_contacts', {
      lang: user.locale,
      args: {
        wardName: user.name,
        message: data.message || '',
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

    this.logger.error(`🆘 SOS triggered by ${user.name}!`);

    return alert;
  }

  async resolve(alertId: string, resolvedBy: string) {
    return this.prisma.sosAlert.update({
      where: { id: alertId },
      data: { resolvedAt: new Date(), resolvedBy },
    });
  }

  async getHistory(userId: string) {
    return this.prisma.sosAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
