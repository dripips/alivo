import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MedicalService } from './medical.service';
import { MedicationScheduler } from './medication.scheduler';
import { MedicationProcessor } from './medication.processor';
import { MedicalController } from './medical.controller';
import { ChannelsModule } from '../channels/channels.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'medication' }),
    ChannelsModule,
  ],
  providers: [MedicalService, MedicationScheduler, MedicationProcessor],
  controllers: [MedicalController],
  exports: [MedicalService],
})
export class MedicalModule {}
