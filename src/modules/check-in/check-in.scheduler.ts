import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class CheckInScheduler {
  private readonly logger = new Logger(CheckInScheduler.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('checkin') private checkInQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async scheduleCheckIns() {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDay = dayNames[now.getDay()];

    const schedules = await this.prisma.checkInSchedule.findMany({
      where: { isActive: true },
      include: { user: { select: { id: true, isActive: true } } },
    });

    for (const schedule of schedules) {
      if (!schedule.user.isActive) continue;

      const times = schedule.times as string[];
      const days = schedule.days as string[];

      if (!days.includes(currentDay)) continue;
      if (!times.includes(currentTime)) continue;

      const alreadySent = await this.prisma.checkIn.findFirst({
        where: {
          userId: schedule.userId,
          scheduledAt: {
            gte: new Date(now.getTime() - 60000),
          },
        },
      });

      if (alreadySent) continue;

      await this.checkInQueue.add(
        'send-checkin',
        { userId: schedule.userId },
        { removeOnComplete: 100, removeOnFail: 50 },
      );

      this.logger.log(`Queued check-in for user ${schedule.userId}`);
    }
  }

  @Cron('*/5 * * * *')
  async processEscalations() {
    await this.checkInQueue.add(
      'process-escalations',
      {},
      { removeOnComplete: 50 },
    );
  }
}
