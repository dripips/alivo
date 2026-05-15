import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateContactDto) {
    return this.prisma.emergencyContact.create({
      data: {
        userId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        channel: dto.channel as any,
        channelId: dto.channelId,
        priority: dto.priority,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.emergencyContact.findMany({
      where: { userId },
      orderBy: { priority: 'asc' },
    });
  }

  async remove(userId: string, contactId: string) {
    const contact = await this.prisma.emergencyContact.findFirst({
      where: { id: contactId, userId },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return this.prisma.emergencyContact.delete({ where: { id: contactId } });
  }

  async getContactsForAlert(userId: string) {
    const [emergencyContacts, guardians] = await Promise.all([
      this.prisma.emergencyContact.findMany({
        where: { userId },
        orderBy: { priority: 'asc' },
      }),
      this.prisma.guardianWard.findMany({
        where: { wardId: userId },
        include: { guardian: { include: { channels: true } } },
      }),
    ]);

    return { emergencyContacts, guardians: guardians.map((g) => g.guardian) };
  }
}
