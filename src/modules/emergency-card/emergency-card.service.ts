import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class EmergencyCardService {
  constructor(private prisma: PrismaService) {}

  async generateToken(userId: string): Promise<string> {
    const token = uuid().replace(/-/g, '').substring(0, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { emergencyCardToken: token },
    });
    return token;
  }

  async getCardByToken(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { emergencyCardToken: token },
      select: {
        name: true,
        birthDate: true,
        phone: true,
        locale: true,
        medicalProfile: {
          select: {
            conditions: true,
            allergies: true,
            bloodType: true,
            doctorName: true,
            doctorPhone: true,
            notes: true,
          },
        },
        medications: {
          where: { isActive: true },
          select: { name: true, dosage: true, instructions: true },
        },
        emergencyContacts: {
          select: { name: true, phone: true, priority: true },
          orderBy: { priority: 'asc' },
          take: 5,
        },
      },
    });

    if (!user) throw new NotFoundException('Card not found');
    return user;
  }

  async getMyCard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emergencyCardToken: true },
    });
    return {
      token: user?.emergencyCardToken,
      url: user?.emergencyCardToken
        ? `/api/emergency-card/${user.emergencyCardToken}`
        : null,
    };
  }
}
