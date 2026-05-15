import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { StripeService } from './stripe.service';
import { UsageService } from './usage.service';

@Module({
  providers: [BillingService, StripeService, UsageService],
  controllers: [BillingController],
  exports: [BillingService, UsageService],
})
export class BillingModule {}
