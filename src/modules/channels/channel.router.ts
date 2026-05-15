import { Injectable, Logger } from '@nestjs/common';
import { ChannelAdapter, OutgoingMessage } from './channel.interface';
import { TelegramAdapter } from './telegram/telegram.adapter';
import { VkMaxAdapter } from './vk-max/vk-max.adapter';
import { WebGateway } from './web/web.gateway';

@Injectable()
export class ChannelRouter {
  private readonly logger = new Logger(ChannelRouter.name);
  private adapters: Map<string, ChannelAdapter> = new Map();

  constructor(
    private telegram: TelegramAdapter,
    private vkMax: VkMaxAdapter,
    private web: WebGateway,
  ) {
    this.adapters.set('TELEGRAM', telegram);
    this.adapters.set('VK_MAX', vkMax);
    this.adapters.set('WEB', web);
  }

  getAdapter(type: string): ChannelAdapter | undefined {
    return this.adapters.get(type);
  }

  async send(channelType: string, msg: OutgoingMessage): Promise<boolean> {
    const adapter = this.adapters.get(channelType);
    if (!adapter) {
      this.logger.warn(`No adapter for channel: ${channelType}`);
      return false;
    }

    try {
      await adapter.sendMessage(msg);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send via ${channelType}: ${error}`);
      return false;
    }
  }

  async sendAlert(
    channelType: string,
    externalUserId: string,
    text: string,
  ): Promise<boolean> {
    const adapter = this.adapters.get(channelType);
    if (!adapter) return false;

    try {
      await adapter.sendAlert(externalUserId, text);
      return true;
    } catch (error) {
      this.logger.error(`Failed to alert via ${channelType}: ${error}`);
      return false;
    }
  }

  async broadcast(
    channels: Array<{ type: string; externalId: string }>,
    text: string,
  ): Promise<void> {
    await Promise.allSettled(
      channels.map((ch) => this.sendAlert(ch.type, ch.externalId, text)),
    );
  }
}
