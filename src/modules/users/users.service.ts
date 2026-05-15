import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        channels: true,
        medicalProfile: true,
        medications: { where: { isActive: true } },
        checkInSchedule: true,
        emergencyContacts: { orderBy: { priority: 'asc' } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByChannelId(type: string, externalId: string) {
    const channel = await this.prisma.userChannel.findUnique({
      where: { type_externalId: { type: type as any, externalId } },
      include: { user: true },
    });
    return channel?.user ?? null;
  }

  async getGuardians(wardId: string) {
    const relations = await this.prisma.guardianWard.findMany({
      where: { wardId },
      include: {
        guardian: { include: { channels: true } },
      },
    });
    return relations.map((r) => r.guardian);
  }

  async getWards(guardianId: string) {
    const relations = await this.prisma.guardianWard.findMany({
      where: { guardianId },
      include: {
        ward: {
          include: {
            channels: true,
            medicalProfile: true,
            checkInSchedule: true,
          },
        },
      },
    });
    return relations.map((r) => r.ward);
  }

  async linkChannel(
    userId: string,
    type: string,
    externalId: string,
    username?: string,
  ) {
    return this.prisma.userChannel.upsert({
      where: { type_externalId: { type: type as any, externalId } },
      update: { username, isVerified: true },
      create: {
        userId,
        type: type as any,
        externalId,
        username,
        isVerified: true,
        isPrimary: true,
      },
    });
  }
}
