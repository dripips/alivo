import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardGateway } from './dashboard.gateway';
import { UsersModule } from '../users/users.module';
import { CheckInModule } from '../check-in/check-in.module';
import { MedicalModule } from '../medical/medical.module';
import { WellnessModule } from '../wellness/wellness.module';

@Module({
  imports: [UsersModule, CheckInModule, MedicalModule, WellnessModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardGateway],
  exports: [DashboardService],
})
export class DashboardModule {}
