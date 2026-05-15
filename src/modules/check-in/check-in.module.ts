import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CheckInService } from './check-in.service';
import { CheckInScheduler } from './check-in.scheduler';
import { CheckInProcessor } from './check-in.processor';
import { CheckInController } from './check-in.controller';
import { ChannelsModule } from '../channels/channels.module';
import { UsersModule } from '../users/users.module';
import { forwardRef as fwdRef } from '@nestjs/common';
import { EscalationModule } from '../escalation/escalation.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'checkin' }),
    ChannelsModule,
    UsersModule,
    forwardRef(() => EscalationModule),
  ],
  providers: [CheckInService, CheckInScheduler, CheckInProcessor],
  controllers: [CheckInController],
  exports: [CheckInService],
})
export class CheckInModule {}
