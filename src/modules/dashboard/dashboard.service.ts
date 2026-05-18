import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UsersService } from '../users/users.service';
import { CheckInService } from '../check-in/check-in.service';
import { MedicalService } from '../medical/medical.service';
import { WellnessService } from '../wellness/wellness.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private checkIn: CheckInService,
    private medical: MedicalService,
    private wellness: WellnessService,
  ) {}

  async getWardDashboard(guardianId: string, wardId: string) {
    const wards = await this.users.getWards(guardianId);
    const ward = wards.find((w) => w.id === wardId);
    if (!ward) return null;

    const [
      moodStats,
      medications,
      adherence,
      recentCheckIns,
      fraudAlerts,
      latestVitals,
      wellnessStats,
    ] = await Promise.all([
      this.checkIn.getMoodStats(wardId, 30),
      this.medical.getMedications(wardId),
      this.medical.getMedicationAdherence(wardId, 7),
      this.checkIn.getHistory(wardId, 10),
      this.prisma.fraudAlert.findMany({
        where: { userId: wardId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.wellness.getLatest(wardId),
      this.wellness.getStats(wardId, 7),
    ]);

    const lastCheckIn = recentCheckIns[0] ?? null;
    const lastActive = lastCheckIn?.respondedAt ?? lastCheckIn?.scheduledAt;

    return {
      ward: {
        id: ward.id,
        name: ward.name,
        locale: ward.locale,
        isActive: ward.isActive,
        lastActive,
      },
      mood: moodStats,
      checkIns: {
        recent: recentCheckIns,
        lastResponse: lastCheckIn,
      },
      medical: {
        medications,
        adherence,
        profile: ward.medicalProfile,
      },
      fraudAlerts,
      wellness: {
        latest: latestVitals,
        recent: wellnessStats,
      },
    };
  }

  async getGuardianOverview(guardianId: string) {
    const wards = await this.users.getWards(guardianId);

    const overview = await Promise.all(
      wards.map(async (ward) => {
        const lastCheckIn = await this.prisma.checkIn.findFirst({
          where: { userId: ward.id },
          orderBy: { scheduledAt: 'desc' },
        });

        const mood = await this.checkIn.getMoodStats(ward.id, 7);

        return {
          id: ward.id,
          name: ward.name,
          lastCheckIn,
          moodAverage: mood.average,
          moodTrend: mood.trend,
          status: this.getWardStatus(lastCheckIn),
        };
      }),
    );

    return overview;
  }

  private getWardStatus(lastCheckIn: any): string {
    if (!lastCheckIn) return 'unknown';
    if (lastCheckIn.status === 'RESPONDED') return 'ok';
    if (lastCheckIn.status === 'MISSED') return 'alert';
    if (lastCheckIn.status === 'ESCALATED') return 'escalated';
    if (lastCheckIn.status === 'PENDING') return 'waiting';
    return 'unknown';
  }
}
