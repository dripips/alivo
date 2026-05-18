import { Module, forwardRef } from '@nestjs/common';
import { CompanionService } from './companion.service';
import { CompanionController } from './companion.controller';
import { MemoryService } from './memory.service';
import { SafetyAnalyzer } from './safety.analyzer';
import { ChannelsModule } from '../channels/channels.module';
import { UsersModule } from '../users/users.module';
import { EscalationModule } from '../escalation/escalation.module';
import { FraudDetectionModule } from '../fraud-detection/fraud-detection.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    forwardRef(() => ChannelsModule),
    UsersModule,
    forwardRef(() => EscalationModule),
    forwardRef(() => FraudDetectionModule),
    BillingModule,
  ],
  controllers: [CompanionController],
  providers: [CompanionService, MemoryService, SafetyAnalyzer],
  exports: [CompanionService, SafetyAnalyzer],
})
export class CompanionModule {}
