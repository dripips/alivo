import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../common/prisma.service';
import { ChannelRouter } from '../channels/channel.router';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private prisma: PrismaService,
    private channels: ChannelRouter,
    private i18n: I18nService,
  ) {}

  async create(userId: string, data: {
    title: string;
    description?: string;
    location?: string;
    doctorName?: string;
    scheduledAt: string;
    remindBefore?: number;
    notes?: string;
  }) {
    return this.prisma.appointment.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        location: data.location,
        doctorName: data.doctorName,
        scheduledAt: new Date(data.scheduledAt),
        remindBefore: data.remindBefore ?? 60,
        notes: data.notes,
      },
    });
  }

  async getUpcoming(userId: string) {
    return this.prisma.appointment.findMany({
      where: {
        userId,
        scheduledAt: { gte: new Date() },
        isCompleted: false,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getAll(userId: string) {
    return this.prisma.appointment.findMany({
      where: { userId },
      orderBy: { scheduledAt: 'desc' },
      take: 50,
    });
  }

  async complete(userId: string, id: string) {
    const apt = await this.prisma.appointment.findFirst({
      where: { id, userId },
    });
    if (!apt) throw new NotFoundException('Appointment not found');
    return this.prisma.appointment.update({
      where: { id },
      data: { isCompleted: true },
    });
  }

  async delete(userId: string, id: string) {
    const apt = await this.prisma.appointment.findFirst({
      where: { id, userId },
    });
    if (!apt) throw new NotFoundException('Appointment not found');
    return this.prisma.appointment.delete({ where: { id } });
  }

  async sendReminder(appointmentId: string) {
    const apt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { user: { include: { channels: { where: { isPrimary: true } } } } },
    });
    if (!apt || !apt.user.channels.length) return;

    const text = String(this.i18n.t('appointments.reminder', {
      lang: apt.user.locale,
      args: {
        title: apt.title,
        time: apt.scheduledAt.toLocaleTimeString(apt.user.locale === 'ru' ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
        location: apt.location || '',
        doctor: apt.doctorName || '',
        notes: apt.notes || '',
      },
    }));

    for (const ch of apt.user.channels) {
      await this.channels.send(ch.type, {
        externalUserId: ch.externalId,
        text,
      });
    }

    this.logger.log(`Appointment reminder sent: ${apt.title} for ${apt.user.name}`);
  }
}
