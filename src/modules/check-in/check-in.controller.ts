import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckInService } from './check-in.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@ApiTags('Check-ins')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/check-ins')
export class CheckInController {
  constructor(private checkIn: CheckInService) {}

  @Post('schedule')
  @ApiOperation({ summary: 'Set check-in schedule' })
  createSchedule(@Req() req: any, @Body() dto: CreateScheduleDto) {
    return this.checkIn.createSchedule(req.user.id, dto.times, dto.days);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get check-in history' })
  getHistory(@Req() req: any, @Query('limit') limit?: string) {
    return this.checkIn.getHistory(req.user.id, limit ? parseInt(limit) : 30);
  }

  @Get('mood')
  @ApiOperation({ summary: 'Get mood statistics' })
  getMoodStats(@Req() req: any, @Query('days') days?: string) {
    return this.checkIn.getMoodStats(req.user.id, days ? parseInt(days) : 30);
  }
}
