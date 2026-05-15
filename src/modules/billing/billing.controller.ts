import {
  Controller, Get, Post, Body, Req, Res,
  UseGuards, RawBodyRequest, Headers,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum } from 'class-validator';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { UsageService } from './usage.service';

class SubscribeDto {
  @ApiProperty({ enum: ['FREE', 'FAMILY', 'CARE'] })
  @IsString()
  planTier: string;

  @ApiProperty({ enum: ['monthly', 'yearly'], example: 'monthly' })
  @IsEnum(['monthly', 'yearly'])
  period: 'monthly' | 'yearly';
}

@ApiTags('Billing')
@Controller('api/billing')
export class BillingController {
  constructor(
    private billing: BillingService,
    private stripe: StripeService,
    private usage: UsageService,
  ) {}

  @Get('plans')
  @ApiOperation({ summary: 'List available plans' })
  getPlans() {
    return this.billing.getPlans();
  }

  @Get('subscription')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my subscription' })
  getSubscription(@Req() req: any) {
    return this.billing.getMySubscription(req.user.id);
  }

  @Post('subscribe')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Subscribe to a plan (returns Stripe checkout URL)' })
  subscribe(@Req() req: any, @Body() dto: SubscribeDto) {
    return this.billing.subscribe(req.user.id, dto.planTier, dto.period);
  }

  @Get('usage')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get usage summary for current month' })
  getUsage(@Req() req: any) {
    return this.usage.getUsageSummary(req.user.id);
  }

  @Post('webhook/stripe')
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
    @Res() res: Response,
  ) {
    try {
      const event = this.stripe.constructEvent(req.rawBody!, sig);
      if (event) {
        await this.billing.handleStripeWebhook(event);
      }
      res.status(200).json({ received: true });
    } catch (err) {
      res.status(400).json({ error: 'Webhook error' });
    }
  }
}
