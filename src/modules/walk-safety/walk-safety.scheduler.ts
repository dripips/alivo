import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WalkSafetyService } from './walk-safety.service';

@Injectable()
export class WalkSafetyScheduler {
  constructor(private walks: WalkSafetyService) {}

  @Cron('*/2 * * * *')
  async checkOverdueWalks() {
    await this.walks.checkOverdueWalks();
  }
}
