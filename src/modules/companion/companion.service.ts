import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import OpenAI from 'openai';
import { PrismaService } from '../../common/prisma.service';
import { MemoryService } from './memory.service';
import { SafetyAnalyzer, SafetyAssessment } from './safety.analyzer';
import { ChannelRouter } from '../channels/channel.router';
import { EscalationService } from '../escalation/escalation.service';
import { FraudDetectionService } from '../fraud-detection/fraud-detection.service';

@Injectable()
export class CompanionService {
  private readonly logger = new Logger(CompanionService.name);
  private ai: OpenAI;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private memory: MemoryService,
    private safety: SafetyAnalyzer,
    private channels: ChannelRouter,
    private i18n: I18nService,
    @Inject(forwardRef(() => EscalationService))
    private escalation: EscalationService,
    @Inject(forwardRef(() => FraudDetectionService))
    private fraudDetection: FraudDetectionService,
  ) {
    this.ai = new OpenAI({
      apiKey: config.get('AI_API_KEY', ''),
      baseURL: config.get('AI_BASE_URL', 'https://api.openai.com/v1'),
    });
  }

  async chat(
    userId: string,
    text: string,
    channelType: string,
  ): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { medicalProfile: true },
    });
    if (!user) return '';

    const fraudCheck = await this.fraudDetection.analyze(userId, text, channelType);
    if (fraudCheck.isFraud) {
      return fraudCheck.warningMessage;
    }

    const safetyCheck = this.safety.quickCheck(text, user.locale);

    let conversation = await this.getOrCreateConversation(userId, channelType);

    await this.prisma.message.create({
      data: { conversationId: conversation.id, role: 'user', content: text },
    });

    const recentMessages = await this.memory.getRecentMessages(
      conversation.id,
      20,
    );
    const conversationSummary = await this.memory.getConversationSummary(
      userId,
    );

    const systemPrompt = this.buildSystemPrompt(
      user,
      conversationSummary,
      safetyCheck,
    );

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const completion = await this.ai.chat.completions.create({
      model: this.config.get('AI_MODEL', 'gpt-4o-mini'),
      messages,
      max_tokens: 500,
      temperature: 0.8,
    });

    const reply = completion.choices[0]?.message?.content ?? '';

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: reply,
        metadata: {
          safetyLevel: safetyCheck.level,
          mood: safetyCheck.estimatedMood,
        },
      },
    });

    if (safetyCheck.level === 'crisis') {
      await this.escalation.triggerCrisisAlert(user, text, safetyCheck);
    } else if (safetyCheck.level === 'concern') {
      await this.escalation.triggerMoodConcern(user, safetyCheck);
    }

    return reply;
  }

  private buildSystemPrompt(
    user: any,
    summary: string | null,
    safetyCheck: SafetyAssessment,
  ): string {
    const locale = user.locale || 'ru';
    const isRu = locale === 'ru';

    let prompt = isRu
      ? `Ты — Alivo, тёплый и заботливый AI-компаньон. Ты общаешься с ${user.name}.`
      : `You are Alivo, a warm and caring AI companion. You're chatting with ${user.name}.`;

    prompt += isRu
      ? `\n\nТвоя задача — быть настоящим другом: слушать, поддерживать, интересоваться жизнью собеседника.`
      : `\n\nYour mission is to be a real friend: listen, support, and show genuine interest.`;

    prompt += isRu
      ? `\nГовори просто и тепло. Не будь формальным. Используй разговорный стиль.`
      : `\nSpeak warmly and simply. Don't be formal. Use a conversational tone.`;

    if (user.medicalProfile) {
      const conditions = user.medicalProfile.conditions?.join(', ');
      if (conditions) {
        prompt += isRu
          ? `\n\nУ собеседника есть заболевания: ${conditions}. Можешь мягко интересоваться самочувствием, напоминать о здоровье.`
          : `\n\nThe person has conditions: ${conditions}. You may gently ask about their wellbeing.`;
      }

      if (user.medicalProfile.allergies?.length) {
        prompt += isRu
          ? ` Аллергии: ${user.medicalProfile.allergies.join(', ')}.`
          : ` Allergies: ${user.medicalProfile.allergies.join(', ')}.`;
      }
    }

    if (summary) {
      prompt += isRu
        ? `\n\nИз прошлых разговоров ты знаешь: ${summary}`
        : `\n\nFrom past conversations you know: ${summary}`;
    }

    if (safetyCheck.level === 'crisis') {
      prompt += isRu
        ? `\n\n⚠️ ВАЖНО: Собеседник выражает тревожные мысли. Будь максимально поддерживающим. НЕ читай нотации. НЕ обесценивай чувства. Мягко предложи поговорить о том, что беспокоит. Упомяни линию помощи: 8-800-2000-122.`
        : `\n\n⚠️ IMPORTANT: The person is expressing concerning thoughts. Be maximally supportive. Do NOT lecture. Do NOT dismiss feelings. Gently offer to talk. Mention the helpline: 988.`;
    }

    prompt += isRu
      ? `\n\nОтвечай кратко (2-4 предложения). Задавай вопросы, проявляй интерес.`
      : `\n\nKeep replies short (2-4 sentences). Ask questions, show interest.`;

    return prompt;
  }

  private async getOrCreateConversation(userId: string, channelType: string) {
    const recent = await this.prisma.conversation.findFirst({
      where: {
        userId,
        endedAt: null,
        startedAt: { gte: new Date(Date.now() - 4 * 60 * 60 * 1000) },
      },
      orderBy: { startedAt: 'desc' },
    });

    if (recent) return recent;

    return this.prisma.conversation.create({
      data: {
        userId,
        mode: 'COMPANION',
        channel: channelType as any,
      },
    });
  }
}
