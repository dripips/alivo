import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { AppointmentScheduler } from './appointments.scheduler';
import { ChannelsModule } from '../channels/channels.module';

@Module({
  imports: [BullModule.registerQueue({ name: 'appointments' }), ChannelsModule],
  providers: [AppointmentsService, AppointmentScheduler],
  controllers: [AppointmentsController],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
