import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ChannelAdapter,
  IncomingMessage,
  OutgoingMessage,
  MessageButton,
} from '../channel.interface';

@Injectable()
export class VkMaxAdapter implements ChannelAdapter, OnModuleDestroy {
  readonly type = 'VK_MAX' as const;
  private readonly logger = new Logger(VkMaxAdapter.name);
  private bot: any = null;
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
    const token = this.config.get<string>('MAX_BOT_TOKEN');
    if (!token) return;

    try {
      const { Bot } = await import('@maxhub/max-bot-api');
      this.bot = new Bot(token);

      this.bot.onMessage(async (message: any) => {
        if (!this.messageHandler) return;
        await this.messageHandler({
          channelType: 'VK_MAX',
          externalUserId: String(message.sender?.userId ?? message.sender?.id),
          username: message.sender?.username,
          text: message.body?.text ?? '',
          callbackData: message.body?.payload,
        });
      });

      this.bot.onCallback(async (callback: any) => {
        if (!this.callbackHandler) return;
        await this.callbackHandler({
          channelType: 'VK_MAX',
          externalUserId: String(
            callback.sender?.userId ?? callback.sender?.id,
          ),
          username: callback.sender?.username,
          text: '',
          callbackData: callback.payload,
        });
      });

      await this.bot.start();
      this.logger.log('VK MAX bot launched');
    } catch (error) {
      this.logger.warn(`VK MAX adapter failed to start: ${error}`);
    }
  }

  async stop() {
    if (this.bot?.stop) {
      await this.bot.stop();
    }
  }

  async onModuleDestroy() {
    await this.stop();
  }

  async sendMessage(msg: OutgoingMessage) {
    if (!this.bot) return;

    const payload: any = {
      chatId: msg.externalUserId,
      text: msg.text,
    };

    if (msg.buttons?.length) {
      payload.attachments = [
        {
          type: 'inline_keyboard',
          payload: {
            buttons: msg.buttons.map((b: MessageButton) => [
              { type: 'callback', text: b.label, payload: b.callbackData },
            ]),
          },
        },
      ];
    }

    await this.bot.sendMessage(payload);
  }

  async sendAlert(externalUserId: string, text: string) {
    if (!this.bot) return;
    await this.bot.sendMessage({ chatId: externalUserId, text });
  }
}
