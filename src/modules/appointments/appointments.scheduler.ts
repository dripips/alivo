import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma.service';
import { AppointmentsService } from './appointments.service';

@Injectable()
export class AppointmentScheduler {
  private readonly logger = new Logger(AppointmentScheduler.name);

  constructor(
    private prisma: PrismaService,
    private appointments: AppointmentsService,
  ) {}

  @Cron('* * * * *')
  async checkUpcoming() {
    const now = new Date();

    const upcoming = await this.prisma.appointment.findMany({
      where: {
        isCompleted: false,
        scheduledAt: { gte: now },
      },
    });

    for (const apt of upcoming) {
      const minutesUntil = Math.floor(
        (apt.scheduledAt.getTime() - now.getTime()) / 60000,
      );

      if (Math.abs(minutesUntil - apt.remindBefore) <= 1) {
        await this.appointments.sendReminder(apt.id);
      }
    }
  }
}
