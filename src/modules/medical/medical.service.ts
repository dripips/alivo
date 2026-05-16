import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../common/prisma.service';
import { ChannelRouter } from '../channels/channel.router';
import { CreateMedicalProfileDto } from './dto/create-medical-profile.dto';
import { CreateMedicationDto } from './dto/create-medication.dto';

@Injectable()
export class MedicalService {
  private readonly logger = new Logger(MedicalService.name);

  constructor(
    private prisma: PrismaService,
    private channels: ChannelRouter,
    private i18n: I18nService,
  ) {}

  async upsertProfile(userId: string, dto: CreateMedicalProfileDto) {
    return this.prisma.medicalProfile.upsert({
      where: { userId },
      update: { ...dto },
      create: { userId, ...dto },
    });
  }

  async getProfile(userId: string) {
    return this.prisma.medicalProfile.findUnique({ where: { userId } });
  }

  async addMedication(userId: string, dto: CreateMedicationDto) {
    return this.prisma.medication.create({
      data: {
        userId,
        name: dto.name,
        dosage: dto.dosage,
        schedule: dto.schedule,
        instructions: dto.instructions,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async getMedications(userId: string) {
    return this.prisma.medication.findMany({
      where: { userId, isActive: true },
      include: {
        logs: {
          orderBy: { scheduledAt: 'desc' },
          take: 7,
        },
      },
    });
  }

  async deactivateMedication(userId: string, medicationId: string) {
    const med = await this.prisma.medication.findFirst({
      where: { id: medicationId, userId },
    });
    if (!med) throw new NotFoundException('Medication not found');
    return this.prisma.medication.update({
      where: { id: medicationId },
      data: { isActive: false },
    });
  }

  async sendReminder(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        channels: { where: { isPrimary: true } },
        medications: { where: { isActive: true } },
      },
    });

    if (!user?.channels.length || !user.medications.length) return;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDay = dayNames[now.getDay()];

    const dueMeds = user.medications.filter((med) => {
      const schedule = med.schedule as Array<{
        time: string;
        days: string[];
      }>;
      return schedule.some(
        (s) => s.time === currentTime && s.days.includes(currentDay),
      );
    });

    if (!dueMeds.length) return;

    const medsText = dueMeds
      .map((m) =>
        this.i18n.t('medical.medication_single', {
          lang: user.locale,
          args: { name: m.name, dosage: m.dosage },
        }),
      )
      .join('\n');

    const instructions = dueMeds
      .filter((m) => m.instructions)
      .map((m) =>
        this.i18n.t('medical.medication_instruction', {
          lang: user.locale,
          args: { instruction: m.instructions },
        }),
      )
      .join('\n');

    const text = this.i18n.t('medical.medication_reminder', {
      lang: user.locale,
      args: { medications: medsText, instructions },
    });

    const logIds: string[] = [];
    for (const med of dueMeds) {
      const log = await this.prisma.medicationLog.create({
        data: { medicationId: med.id, scheduledAt: now },
      });
      logIds.push(log.id);
    }

    const buttons = [
      {
        label: this.i18n.t('medical.buttons.taken', { lang: user.locale }),
        callbackData: `med:${logIds.join(',')}:taken`,
      },
      {
        label: this.i18n.t('medical.buttons.snooze', { lang: user.locale }),
        callbackData: `med:${logIds.join(',')}:snooze`,
      },
      {
        label: this.i18n.t('medical.buttons.skip', { lang: user.locale }),
        callbackData: `med:${logIds.join(',')}:skip`,
      },
    ];

    for (const channel of user.channels) {
      await this.channels.send(channel.type, {
        externalUserId: channel.externalId,
        text,
        buttons,
      });
    }

    this.logger.log(`Medication reminder sent to ${user.name}`);
  }

  async handleMedicationResponse(logIds: string[], status: string) {
    const updateData: any = { status };
    if (status === 'taken') {
      updateData.confirmedAt = new Date();
    }

    await this.prisma.medicationLog.updateMany({
      where: { id: { in: logIds } },
      data: updateData,
    });
  }

  async logMedicationAction(userId: string, medicationId: string, status: string) {
    const med = await this.prisma.medication.findFirst({
      where: { id: medicationId, userId },
    });
    if (!med) return { error: 'Not found' };

    const log = await this.prisma.medicationLog.create({
      data: {
        medicationId,
        scheduledAt: new Date(),
        status: status as any,
        confirmedAt: status === 'TAKEN' ? new Date() : undefined,
      },
    });

    return log;
  }

  async getMedicationAdherence(userId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const logs = await this.prisma.medicationLog.findMany({
      where: {
        medication: { userId },
        scheduledAt: { gte: since },
      },
      include: { medication: { select: { name: true } } },
    });

    const total = logs.length;
    const taken = logs.filter((l) => l.status === 'TAKEN').length;
    const missed = logs.filter((l) => l.status === 'MISSED').length;
    const skipped = logs.filter((l) => l.status === 'SKIPPED').length;

    return {
      total,
      taken,
      missed,
      skipped,
      adherenceRate: total > 0 ? Math.round((taken / total) * 100) : 100,
      logs,
    };
  }
}
