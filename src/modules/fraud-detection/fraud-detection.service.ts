import { Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../common/prisma.service';
import { ChannelRouter } from '../channels/channel.router';
import { ContactsService } from '../contacts/contacts.service';

interface FraudCheckResult {
  isFraud: boolean;
  warningMessage: string;
  matchedPatterns: string[];
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  private readonly patterns = {
    ru: [
      { key: 'bank_call', regex: /код\s*(из)?\s*смс|cvv|пин[\s-]?код|данные\s*карты/i },
      { key: 'bank_call', regex: /служба\s*безопасности\s*банка|сбербанк.*звон|банк.*заблокиров/i },
      { key: 'safe_account', regex: /безопасн(ый|ая)\s*(счёт|счет|ячейк)/i },
      { key: 'police_call', regex: /следовател.*звон|полиц.*перевести|фсб.*деньги|мвд.*счёт/i },
      { key: 'remote_access', regex: /anydesk|teamviewer|установи(те)?\s*приложение.*удалённ/i },
      { key: 'secret_operation', regex: /никому\s*не\s*говори(те)?|секретн(ая|ый)\s*операци/i },
      { key: 'prize_win', regex: /выиграли\s*(приз|миллион)|получи(те|ть)\s*выигрыш/i },
      { key: 'bank_call', regex: /перевести\s*деньги|перевод\s*на\s*(другой\s*)?счёт/i },
    ],
    en: [
      { key: 'bank_call', regex: /sms\s*code|cvv|pin\s*code|card\s*details/i },
      { key: 'bank_call', regex: /bank.*security|bank.*blocked|bank.*called/i },
      { key: 'safe_account', regex: /safe\s*account|secure\s*account/i },
      { key: 'police_call', regex: /police.*transfer|fbi.*money|officer.*payment/i },
      { key: 'remote_access', regex: /anydesk|teamviewer|install.*remote.*app/i },
      { key: 'secret_operation', regex: /don'?t\s*tell\s*anyone|secret\s*operation/i },
      { key: 'prize_win', regex: /won\s*(a\s*)?(prize|million)|claim.*winnings/i },
      { key: 'bank_call', regex: /transfer\s*money|wire.*funds.*account/i },
    ],
  };

  constructor(
    private prisma: PrismaService,
    private channels: ChannelRouter,
    private contacts: ContactsService,
    private i18n: I18nService,
  ) {}

  async analyze(
    userId: string,
    text: string,
    channelType: string,
  ): Promise<FraudCheckResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return { isFraud: false, warningMessage: '', matchedPatterns: [] };

    const lang = user.locale === 'en' ? 'en' : 'ru';
    const matched: string[] = [];

    for (const pattern of this.patterns[lang]) {
      if (pattern.regex.test(text)) {
        matched.push(pattern.key);
      }
    }

    if (matched.length === 0) {
      return { isFraud: false, warningMessage: '', matchedPatterns: [] };
    }

    const uniquePatterns = [...new Set(matched)];
    const explanations = uniquePatterns
      .map((key) =>
        this.i18n.t(`fraud.patterns.${key}`, { lang: user.locale }),
      )
      .join('\n');

    const warningMessage = this.i18n.t('fraud.warning', {
      lang: user.locale,
      args: { explanation: explanations },
    });

    const alert = await this.prisma.fraudAlert.create({
      data: {
        userId,
        triggerText: text.substring(0, 500),
        patterns: uniquePatterns,
        aiAnalysis: explanations,
        channel: channelType as any,
      },
    });

    await this.alertContacts(user, text, explanations);

    this.logger.warn(
      `FRAUD DETECTED for ${user.name}: patterns=${uniquePatterns.join(',')}`,
    );

    return { isFraud: true, warningMessage, matchedPatterns: uniquePatterns };
  }

  private async alertContacts(
    user: any,
    triggerText: string,
    analysis: string,
  ) {
    const { emergencyContacts, guardians } =
      await this.contacts.getContactsForAlert(user.id);

    const alertText = this.i18n.t('fraud.alert_to_contacts', {
      lang: user.locale,
      args: {
        wardName: user.name,
        triggerText: triggerText.substring(0, 200),
        analysis,
      },
    });

    const channelsToAlert: Array<{ type: string; externalId: string }> = [];

    for (const guardian of guardians) {
      for (const ch of guardian.channels || []) {
        channelsToAlert.push({ type: ch.type, externalId: ch.externalId });
      }
    }

    for (const contact of emergencyContacts) {
      if (contact.channel && contact.channelId) {
        channelsToAlert.push({
          type: contact.channel,
          externalId: contact.channelId,
        });
      }
    }

    await this.channels.broadcast(channelsToAlert, alertText);

    this.logger.log(
      `Fraud alert sent to ${channelsToAlert.length} contacts for ${user.name}`,
    );
  }
}
