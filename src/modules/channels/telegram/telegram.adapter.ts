import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Markup } from 'telegraf';
import {
  ChannelAdapter,
  IncomingMessage,
  OutgoingMessage,
  MessageButton,
} from '../channel.interface';

@Injectable()
export class TelegramAdapter implements ChannelAdapter, OnModuleDestroy {
  readonly type = 'TELEGRAM' as const;
  private readonly logger = new Logger(TelegramAdapter.name);
  private bot: Telegraf | null = null;
  private messageHandler?: (msg: IncomingMessage) => Promise<void>;
  private callbackHandler?: (msg: IncomingMessage) => Promise<void>;

  constructor(private config: ConfigService) {}

  onMessage(handler: (msg: IncomingMessage) => Promise<void>) {
    this.messageHandler = handler;
  }

  onCallback(handler: (msg: IncomingMessage) => Promise<void>) {
    this.callbackHandler = handler;
  }

  async start() {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) return;

    this.bot = new Telegraf(token);

    this.bot.on('text', async (ctx) => {
      if (!this.messageHandler) return;
      await this.messageHandler({
        channelType: 'TELEGRAM',
        externalUserId: String(ctx.from.id),
        username: ctx.from.username,
        text: ctx.message.text,
      });
    });

    this.bot.on('callback_query', async (ctx) => {
      if (!this.callbackHandler || !('data' in ctx.callbackQuery)) return;
      await ctx.answerCbQuery();
      await this.callbackHandler({
        channelType: 'TELEGRAM',
        externalUserId: String(ctx.from.id),
        username: ctx.from.username,
        text: '',
        callbackData: ctx.callbackQuery.data,
      });
    });

    this.bot.command('start', async (ctx) => {
      if (!this.messageHandler) return;
      await this.messageHandler({
        channelType: 'TELEGRAM',
        externalUserId: String(ctx.from.id),
        username: ctx.from.username,
        text: '/start',
      });
    });

    try {
      await this.bot.launch();
      this.logger.log('Telegram bot launched');
    } catch (error) {
      this.logger.warn(`Telegram bot failed to start (invalid token?): ${error}`);
      this.bot = null;
    }
  }

  async stop() {
    this.bot?.stop();
  }

  async onModuleDestroy() {
    await this.stop();
  }

  async sendMessage(msg: OutgoingMessage) {
    if (!this.bot) return;

    const extra: any = {};
    if (msg.buttons?.length) {
      extra.reply_markup = this.buildKeyboard(msg.buttons);
    }
    if (msg.parseMode === 'HTML') {
      extra.parse_mode = 'HTML';
    }

    await this.bot.telegram.sendMessage(msg.externalUserId, msg.text, extra);
  }

  async sendAlert(externalUserId: string, text: string) {
    if (!this.bot) return;
    await this.bot.telegram.sendMessage(externalUserId, text);
  }

  private buildKeyboard(buttons: MessageButton[]) {
    const rows = buttons.map((b) =>
      Markup.button.callback(b.label, b.callbackData),
    );
    return Markup.inlineKeyboard(rows, { columns: 2 }).reply_markup;
  }
}
