import { Module, forwardRef } from '@nestjs/common';
import { CompanionService } from './companion.service';
import { MemoryService } from './memory.service';
import { SafetyAnalyzer } from './safety.analyzer';
import { ChannelsModule } from '../channels/channels.module';
import { UsersModule } from '../users/users.module';
import { EscalationModule } from '../escalation/escalation.module';
import { FraudDetectionModule } from '../fraud-detection/fraud-detection.module';

@Module({
  imports: [
    ChannelsModule,
    UsersModule,
    forwardRef(() => EscalationModule),
    forwardRef(() => FraudDetectionModule),
  ],
  providers: [CompanionService, MemoryService, SafetyAnalyzer],
  exports: [CompanionService, SafetyAnalyzer],
})
export class CompanionModule {}
