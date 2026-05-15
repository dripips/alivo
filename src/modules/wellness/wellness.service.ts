import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class WellnessService {
  constructor(private prisma: PrismaService) {}

  async log(userId: string, data: {
    bloodPressureH?: number;
    bloodPressureL?: number;
    heartRate?: number;
    bloodSugar?: number;
    temperature?: number;
    weight?: number;
    notes?: string;
    measuredAt?: string;
  }) {
    return this.prisma.wellnessLog.create({
      data: {
        userId,
        bloodPressureH: data.bloodPressureH,
        bloodPressureL: data.bloodPressureL,
        heartRate: data.heartRate,
        bloodSugar: data.bloodSugar,
        temperature: data.temperature,
        weight: data.weight,
        notes: data.notes,
        measuredAt: data.measuredAt ? new Date(data.measuredAt) : new Date(),
      },
    });
  }

  async getHistory(userId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.prisma.wellnessLog.findMany({
      where: { userId, measuredAt: { gte: since } },
      orderBy: { measuredAt: 'desc' },
    });
  }

  async getLatest(userId: string) {
    return this.prisma.wellnessLog.findFirst({
      where: { userId },
      orderBy: { measuredAt: 'desc' },
    });
  }

  async getStats(userId: string, days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const logs = await this.prisma.wellnessLog.findMany({
      where: { userId, measuredAt: { gte: since } },
      orderBy: { measuredAt: 'asc' },
    });

    if (!logs.length) return { count: 0 };

    const avg = (arr: number[]) =>
      arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;

    const bpH = logs.map((l) => l.bloodPressureH).filter(Boolean) as number[];
    const bpL = logs.map((l) => l.bloodPressureL).filter(Boolean) as number[];
    const hr = logs.map((l) => l.heartRate).filter(Boolean) as number[];
    const sugar = logs.map((l) => l.bloodSugar).filter(Boolean) as number[];

    return {
      count: logs.length,
      period: `${days} days`,
      bloodPressure: bpH.length
        ? { avgSystolic: avg(bpH), avgDiastolic: avg(bpL), readings: bpH.length }
        : null,
      heartRate: hr.length ? { avg: avg(hr), min: Math.min(...hr), max: Math.max(...hr) } : null,
      bloodSugar: sugar.length ? { avg: avg(sugar), min: Math.min(...sugar), max: Math.max(...sugar) } : null,
      data: logs,
    };
  }
}
