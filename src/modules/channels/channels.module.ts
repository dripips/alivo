import { Module, OnModuleInit, Logger, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChannelRouter } from './channel.router';
import { TelegramAdapter } from './telegram/telegram.adapter';
import { VkMaxAdapter } from './vk-max/vk-max.adapter';
import { WebGateway } from './web/web.gateway';
import { IncomingMessage } from './channel.interface';
import { UsersModule } from '../users/users.module';
import { CompanionModule } from '../companion/companion.module';
import { CheckInModule } from '../check-in/check-in.module';
import { MedicalModule } from '../medical/medical.module';
import { CompanionService } from '../companion/companion.service';
import { CheckInService } from '../check-in/check-in.service';
import { MedicalService } from '../medical/medical.service';
import { UsersService } from '../users/users.service';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => CompanionModule),
    forwardRef(() => CheckInModule),
    forwardRef(() => MedicalModule),
  ],
  providers: [ChannelRouter, TelegramAdapter, VkMaxAdapter, WebGateway],
  exports: [ChannelRouter, TelegramAdapter, VkMaxAdapter, WebGateway],
})
export class ChannelsModule implements OnModuleInit {
  private readonly logger = new Logger(ChannelsModule.name);

  constructor(
    private config: ConfigService,
    private telegram: TelegramAdapter,
    private vkMax: VkMaxAdapter,
    private web: WebGateway,
    private router: ChannelRouter,
    private users: UsersService,
    private companion: CompanionService,
    private checkIn: CheckInService,
    private medical: MedicalService,
  ) {}

  async onModuleInit() {
    // Register handlers on all adapters before starting
    const adapters = [this.telegram, this.vkMax, this.web];
    for (const adapter of adapters) {
      adapter.onMessage(this.handleIncomingMessage.bind(this));
      adapter.onCallback(this.handleIncomingCallback.bind(this));
    }

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

  private async handleIncomingMessage(msg: IncomingMessage): Promise<void> {
    try {
      const user = await this.users.findByChannelId(
        msg.channelType,
        msg.externalUserId,
      );
      if (!user) {
        this.logger.warn(
          `No user found for ${msg.channelType}:${msg.externalUserId}`,
        );
        return;
      }

      const reply = await this.companion.chat(
        user.id,
        msg.text,
        msg.channelType,
      );

      if (reply) {
        await this.router.send(msg.channelType, {
          externalUserId: msg.externalUserId,
          text: reply,
        });
      }
    } catch (error) {
      this.logger.error(`Error handling message: ${error}`);
    }
  }

  private async handleIncomingCallback(msg: IncomingMessage): Promise<void> {
    try {
      const data = msg.callbackData;
      if (!data) return;

      // checkin:{checkInId}:{response}
      if (data.startsWith('checkin:')) {
        const parts = data.split(':');
        const checkInId = parts[1];
        const response = parts[2]; // ok | meh | talk | help
        await this.checkIn.handleResponse(
          checkInId,
          response,
          msg.channelType,
        );
        return;
      }

      // med:{logIds}:{action}
      if (data.startsWith('med:')) {
        const parts = data.split(':');
        const logIds = parts[1].split(',');
        const action = parts[2]; // taken | snooze | skip
        await this.medical.handleMedicationResponse(logIds, action);
        return;
      }

      this.logger.warn(`Unknown callback format: ${data}`);
    } catch (error) {
      this.logger.error(`Error handling callback: ${error}`);
    }
  }
}
