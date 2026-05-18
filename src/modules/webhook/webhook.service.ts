import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import * as crypto from 'crypto';

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private prisma: PrismaService) {}

  async getWebhooks(userId: string) {
    return this.prisma.webhook.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWebhook(userId: string, data: { url: string; events: string[]; secret?: string }) {
    const secret = data.secret || crypto.randomBytes(32).toString('hex');
    return this.prisma.webhook.create({
      data: {
        userId,
        url: data.url,
        events: data.events,
        secret,
      },
    });
  }

  async deleteWebhook(userId: string, webhookId: string) {
    return this.prisma.webhook.updateMany({
      where: { id: webhookId, userId },
      data: { isActive: false },
    });
  }

  async dispatch(event: string, userId: string, data: any) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { userId, isActive: true },
    });

    const matching = webhooks.filter(w => {
      const events = w.events as string[];
      return events.includes('*') || events.includes(event);
    });

    for (const wh of matching) {
      const payload: WebhookPayload = {
        event,
        data,
        timestamp: new Date().toISOString(),
      };

      const signature = crypto
        .createHmac('sha256', wh.secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      try {
        await fetch(wh.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Alivo-Signature': signature,
            'X-Alivo-Event': event,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        });
        this.logger.log(`Webhook delivered: ${event} -> ${wh.url}`);
      } catch (err) {
        this.logger.warn(`Webhook failed: ${event} -> ${wh.url}: ${err}`);
      }
    }
  }
}
