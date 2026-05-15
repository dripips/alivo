import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../common/prisma.service';
import { ChannelRouter } from '../channels/channel.router';
import { ContactsService } from '../contacts/contacts.service';
import { SafetyAssessment } from '../companion/safety.analyzer';

@Injectable()
export class EscalationService {
  private readonly logger = new Logger(EscalationService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private channels: ChannelRouter,
    private contacts: ContactsService,
    private i18n: I18nService,
  ) {}

  async processCheckInEscalation(
    checkIn: any,
    user: any,
    minutesSince: number,
  ) {
    const reminderDelay = parseInt(
      this.config.get('CHECKIN_REMINDER_DELAY', '30'),
    );
    const secondReminderDelay = parseInt(
      this.config.get('CHECKIN_SECOND_REMINDER_DELAY', '60'),
    );
    const alertDelay = parseInt(
      this.config.get('CHECKIN_ALERT_CONTACTS_DELAY', '120'),
    );
    const sosDelay = parseInt(this.config.get('CHECKIN_SOS_DELAY', '240'));

    if (minutesSince >= sosDelay && checkIn.escalationLevel !== 'SOS') {
      await this.escalateToSOS(checkIn, user, minutesSince);
    } else if (
      minutesSince >= alertDelay &&
      !['ALERT_CONTACTS', 'SOS'].includes(checkIn.escalationLevel)
    ) {
      await this.alertContacts(checkIn, user, minutesSince);
    } else if (
      minutesSince >= secondReminderDelay &&
      !['SECOND_REMINDER', 'ALERT_CONTACTS', 'SOS'].includes(
        checkIn.escalationLevel,
      )
    ) {
      await this.sendSecondReminder(checkIn, user);
    } else if (minutesSince >= reminderDelay && !checkIn.escalationLevel) {
      await this.sendFirstReminder(checkIn, user);
    }
  }

  private async sendFirstReminder(checkIn: any, user: any) {
    const text = this.i18n.t('checkin.reminder_first', { lang: user.locale });

    for (const ch of user.channels) {
      await this.channels.send(ch.type, {
        externalUserId: ch.externalId,
        text,
      });
    }

    await this.prisma.checkIn.update({
      where: { id: checkIn.id },
      data: { escalationLevel: 'REMINDER', status: 'REMINDED' },
    });

    this.logger.log(`First reminder sent to ${user.name}`);
  }

  private async sendSecondReminder(checkIn: any, user: any) {
    const text = this.i18n.t('checkin.reminder_second', { lang: user.locale });

    const allChannels = await this.prisma.userChannel.findMany({
      where: { userId: user.id },
    });

    for (const ch of allChannels) {
      await this.channels.send(ch.type, {
        externalUserId: ch.externalId,
        text,
      });
    }

    await this.prisma.checkIn.update({
      where: { id: checkIn.id },
      data: { escalationLevel: 'SECOND_REMINDER' },
    });

    this.logger.log(`Second reminder (all channels) sent to ${user.name}`);
  }

  private async alertContacts(
    checkIn: any,
    user: any,
    minutesSince: number,
  ) {
    const { emergencyContacts, guardians } =
      await this.contacts.getContactsForAlert(user.id);

    const text = this.i18n.t('escalation.alert_missed_checkin', {
      lang: user.locale,
      args: { wardName: user.name, minutes: minutesSince },
    });

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

    await this.channels.broadcast(targets, text);

    await this.prisma.checkIn.update({
      where: { id: checkIn.id },
      data: { escalationLevel: 'ALERT_CONTACTS', status: 'ESCALATED' },
    });

    this.logger.warn(`Alert contacts for ${user.name} (${minutesSince} min)`);
  }

  private async escalateToSOS(
    checkIn: any,
    user: any,
    minutesSince: number,
  ) {
    const text = this.i18n.t('escalation.alert_sos', {
      lang: user.locale,
      args: { wardName: user.name, minutes: minutesSince },
    });

    const { emergencyContacts, guardians } =
      await this.contacts.getContactsForAlert(user.id);

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

    await this.channels.broadcast(targets, text);

    await this.prisma.checkIn.update({
      where: { id: checkIn.id },
      data: { escalationLevel: 'SOS', status: 'MISSED' },
    });

    this.logger.error(`SOS for ${user.name} — ${minutesSince} min no response`);
  }

  async triggerCrisisAlert(user: any, text: string, safety: SafetyAssessment) {
    const { emergencyContacts, guardians } =
      await this.contacts.getContactsForAlert(user.id);

    const alertText = this.i18n.t('companion.safety.alert_to_contacts', {
      lang: user.locale,
      args: {
        wardName: user.name,
        level: safety.level,
      },
    });

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
    this.logger.error(`CRISIS alert for ${user.name}`);
  }

  async triggerMoodConcern(user: any, safety: SafetyAssessment) {
    this.logger.warn(
      `Mood concern for ${user.name}: ${safety.triggers.join(', ')}`,
    );
  }
}
