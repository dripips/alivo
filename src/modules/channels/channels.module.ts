import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChannelRouter } from './channel.router';
import { TelegramAdapter } from './telegram/telegram.adapter';
import { VkMaxAdapter } from './vk-max/vk-max.adapter';
import { WebGateway } from './web/web.gateway';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [ChannelRouter, TelegramAdapter, VkMaxAdapter, WebGateway],
  exports: [ChannelRouter, TelegramAdapter, VkMaxAdapter, WebGateway],
})
export class ChannelsModule implements OnModuleInit {
  private readonly logger = new Logger(ChannelsModule.name);

  constructor(
    private config: ConfigService,
    private telegram: TelegramAdapter,
    private vkMax: VkMaxAdapter,
    private router: ChannelRouter,
  ) {}

  async onModuleInit() {
    const tgToken = this.config.get('TELEGRAM_BOT_TOKEN');
    if (tgToken && tgToken !== 'your-telegram-bot-token') {
      await this.telegram.start();
    } else {
      this.logger.warn('Telegram: no valid token, skipping');
    }

    const maxToken = this.config.get('MAX_BOT_TOKEN');
    if (maxToken && maxToken !== 'your-max-bot-token') {
      await this.vkMax.start();
    } else {
      this.logger.warn('VK MAX: no valid token, skipping');
    }
  }
}
