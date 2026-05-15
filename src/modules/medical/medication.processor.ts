import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MedicalService } from './medical.service';

@Processor('medication')
export class MedicationProcessor extends WorkerHost {
  private readonly logger = new Logger(MedicationProcessor.name);

  constructor(private medical: MedicalService) {
    super();
  }

  async process(job: Job) {
    switch (job.name) {
      case 'send-reminder':
        return this.medical.sendReminder(job.data.userId);
      default:
        this.logger.warn(`Unknown job: ${job.name}`);
    }
  }
}
