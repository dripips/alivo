import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { CheckInService } from './check-in.service';
import { EscalationService } from '../escalation/escalation.service';

@Processor('checkin')
export class CheckInProcessor extends WorkerHost {
  private readonly logger = new Logger(CheckInProcessor.name);

  constructor(
    private checkIn: CheckInService,
    @Inject(forwardRef(() => EscalationService))
    private escalation: EscalationService,
  ) {
    super();
  }

  async process(job: Job) {
    switch (job.name) {
      case 'send-checkin':
        return this.handleSendCheckIn(job.data.userId);
      case 'process-escalations':
        return this.handleEscalations();
      default:
        this.logger.warn(`Unknown job: ${job.name}`);
    }
  }

  private async handleSendCheckIn(userId: string) {
    await this.checkIn.sendCheckIn(userId);
  }

  private async handleEscalations() {
    const pending = await this.checkIn.getPendingCheckIns();

    for (const checkIn of pending) {
      const minutesSince = Math.floor(
        (Date.now() - checkIn.scheduledAt.getTime()) / 60000,
      );

      await this.escalation.processCheckInEscalation(
        checkIn,
        checkIn.user,
        minutesSince,
      );
    }
  }
}
