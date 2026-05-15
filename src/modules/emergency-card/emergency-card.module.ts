import { Module } from '@nestjs/common';
import { EmergencyCardService } from './emergency-card.service';
import { EmergencyCardController } from './emergency-card.controller';

@Module({
  providers: [EmergencyCardService],
  controllers: [EmergencyCardController],
  exports: [EmergencyCardService],
})
export class EmergencyCardModule {}
