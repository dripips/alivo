import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { StripeService } from './stripe.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
  ) {}

  async getPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });
  }

  async getMySubscription(userId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!sub) {
      const freePlan = await this.prisma.plan.findUnique({
        where: { tier: 'FREE' },
      });
      return { plan: freePlan, status: 'FREE', isActive: true };
    }

    return sub;
  }

  async subscribe(userId: string, planTier: string, period: 'monthly' | 'yearly') {
    const plan = await this.prisma.plan.findUnique({
      where: { tier: planTier as any },
    });
    if (!plan) throw new ForbiddenException('Plan not found');

    if (plan.tier === 'FREE') {
      return this.createFreeSubscription(userId, plan.id);
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('User not found');

    const checkoutUrl = await this.stripe.createCheckout(
      user,
      plan,
      period,
    );

    return { checkoutUrl };
  }

  async handleStripeWebhook(event: any) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.activateSubscription(event.data.object);
        break;
      case 'invoice.paid':
        await this.renewSubscription(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.cancelSubscription(event.data.object);
        break;
    }
  }

  private async createFreeSubscription(userId: string, planId: string) {
    return this.prisma.subscription.upsert({
      where: { userId },
      update: { planId, status: 'ACTIVE' },
      create: {
        userId,
        planId,
        status: 'ACTIVE',
        currentPeriodEnd: new Date('2099-12-31'),
      },
    });
  }

  private async activateSubscription(session: any) {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    if (!userId || !planId) return;

    await this.prisma.subscription.upsert({
      where: { userId },
      update: {
        planId,
        status: 'ACTIVE',
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      create: {
        userId,
        planId,
        status: 'ACTIVE',
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    this.logger.log(`Subscription activated for user ${userId}`);
  }

  private async renewSubscription(invoice: any) {
    const stripeCustomerId = invoice.customer;
    const sub = await this.prisma.subscription.findFirst({
      where: { stripeCustomerId },
    });
    if (!sub) return;

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  private async cancelSubscription(subscription: any) {
    const sub = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });
    if (!sub) return;

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    this.logger.log(`Subscription cancelled for user ${sub.userId}`);
  }
}
