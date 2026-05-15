import { Module, forwardRef } from '@nestjs/common';
import { SosService } from './sos.service';
import { SosController } from './sos.controller';
import { ChannelsModule } from '../channels/channels.module';
import { ContactsModule } from '../contacts/contacts.module';

@Module({
  imports: [ChannelsModule, ContactsModule],
  providers: [SosService],
  controllers: [SosController],
  exports: [SosService],
})
export class SosModule {}
