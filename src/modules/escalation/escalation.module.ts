import { Module, forwardRef } from '@nestjs/common';
import { EscalationService } from './escalation.service';
import { ChannelsModule } from '../channels/channels.module';
import { ContactsModule } from '../contacts/contacts.module';

@Module({
  imports: [forwardRef(() => ChannelsModule), ContactsModule],
  providers: [EscalationService],
  exports: [EscalationService],
})
export class EscalationModule {}
