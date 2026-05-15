import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: any = null;

  constructor(private config: ConfigService) {
    const key = this.config.get('STRIPE_SECRET_KEY');
    if (key) {
      try {
        const Stripe = require('stripe');
        this.stripe = new Stripe(key);
        this.logger.log('Stripe initialized');
      } catch {
        this.logger.warn('Stripe SDK not installed, billing disabled');
      }
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not set, billing disabled');
    }
  }

  async createCheckout(user: any, plan: any, period: 'monthly' | 'yearly') {
    if (!this.stripe) return null;

    const price = period === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    const appUrl = this.config.get('APP_URL', 'http://localhost:3100');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      metadata: { userId: user.id, planId: plan.id },
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            product_data: {
              name: `Alivo — ${plan.name}`,
              description: plan.description,
            },
            unit_amount: price,
            recurring: {
              interval: period === 'yearly' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing/cancel`,
    });

    return session.url;
  }

  constructEvent(payload: Buffer, signature: string) {
    if (!this.stripe) return null;
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
