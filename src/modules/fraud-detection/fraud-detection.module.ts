import { Module, forwardRef } from '@nestjs/common';
import { FraudDetectionService } from './fraud-detection.service';
import { ChannelsModule } from '../channels/channels.module';
import { ContactsModule } from '../contacts/contacts.module';

@Module({
  imports: [forwardRef(() => ChannelsModule), ContactsModule],
  providers: [FraudDetectionService],
  exports: [FraudDetectionService],
})
export class FraudDetectionModule {}
