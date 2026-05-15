import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class MemoryService {
  constructor(private prisma: PrismaService) {}

  async getRecentMessages(conversationId: string, limit: number) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: { role: true, content: true },
    });
  }

  async getConversationSummary(userId: string): Promise<string | null> {
    const recentConversations = await this.prisma.conversation.findMany({
      where: {
        userId,
        endedAt: { not: null },
        summary: { not: null },
      },
      orderBy: { endedAt: 'desc' },
      take: 3,
      select: { summary: true },
    });

    if (!recentConversations.length) return null;

    return recentConversations
      .map((c) => c.summary)
      .filter(Boolean)
      .join(' ');
  }

  async getPersonalFacts(userId: string): Promise<string[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        conversation: { userId },
        role: 'user',
        metadata: {
          path: ['personalFact'],
          not: undefined as any,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { metadata: true },
    });

    return messages
      .map((m) => (m.metadata as any)?.personalFact)
      .filter(Boolean);
  }
}
