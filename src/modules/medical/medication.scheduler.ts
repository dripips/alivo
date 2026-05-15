import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class MedicationScheduler {
  private readonly logger = new Logger(MedicationScheduler.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('medication') private queue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkMedicationTimes() {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const activeMeds = await this.prisma.medication.findMany({
      where: { isActive: true },
      select: { userId: true, schedule: true },
    });

    const userIds = new Set<string>();
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDay = dayNames[now.getDay()];

    for (const med of activeMeds) {
      const schedule = med.schedule as Array<{
        time: string;
        days: string[];
      }>;
      const isDue = schedule.some(
        (s) => s.time === currentTime && s.days.includes(currentDay),
      );
      if (isDue) userIds.add(med.userId);
    }

    for (const userId of userIds) {
      await this.queue.add(
        'send-reminder',
        { userId },
        { removeOnComplete: 100 },
      );
    }
  }

  @Cron('*/10 * * * *')
  async checkMissedMedications() {
    const threshold = new Date(
      Date.now() -
        parseInt(process.env.MEDICATION_ALERT_CONTACTS_DELAY || '90') *
          60000,
    );

    const missed = await this.prisma.medicationLog.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: { lt: threshold },
      },
    });

    if (missed.length) {
      await this.prisma.medicationLog.updateMany({
        where: { id: { in: missed.map((m) => m.id) } },
        data: { status: 'MISSED' },
      });
    }
  }
}
