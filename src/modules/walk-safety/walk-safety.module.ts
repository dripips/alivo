import { Module } from '@nestjs/common';
import { WalkSafetyService } from './walk-safety.service';
import { WalkSafetyController } from './walk-safety.controller';
import { WalkSafetyScheduler } from './walk-safety.scheduler';
import { ChannelsModule } from '../channels/channels.module';
import { ContactsModule } from '../contacts/contacts.module';

@Module({
  imports: [ChannelsModule, ContactsModule],
  providers: [WalkSafetyService, WalkSafetyScheduler],
  controllers: [WalkSafetyController],
  exports: [WalkSafetyService],
})
export class WalkSafetyModule {}
