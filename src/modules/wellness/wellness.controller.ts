import {
  Controller, Get, Post, Body, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WellnessService } from './wellness.service';

class CreateWellnessLogDto {
  @ApiPropertyOptional({ example: 130, description: 'Systolic BP' })
  @IsOptional() @IsNumber()
  bloodPressureH?: number;

  @ApiPropertyOptional({ example: 85, description: 'Diastolic BP' })
  @IsOptional() @IsNumber()
  bloodPressureL?: number;

  @ApiPropertyOptional({ example: 72 })
  @IsOptional() @IsNumber()
  heartRate?: number;

  @ApiPropertyOptional({ example: 5.8, description: 'mmol/L' })
  @IsOptional() @IsNumber()
  bloodSugar?: number;

  @ApiPropertyOptional({ example: 36.6 })
  @IsOptional() @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({ example: 75.5, description: 'kg' })
  @IsOptional() @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ example: 'Голова немного болит с утра' })
  @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: '2026-05-15T08:00:00Z' })
  @IsOptional() @IsString()
  measuredAt?: string;
}

@ApiTags('Wellness')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/wellness')
export class WellnessController {
  constructor(private wellness: WellnessService) {}

  @Post()
  @ApiOperation({ summary: 'Log wellness measurement (BP, sugar, temp, weight)' })
  log(@Req() req: any, @Body() dto: CreateWellnessLogDto) {
    return this.wellness.log(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get wellness history' })
  getHistory(@Req() req: any, @Query('days') days?: string) {
    return this.wellness.getHistory(req.user.id, days ? parseInt(days) : 30);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest wellness reading' })
  getLatest(@Req() req: any) {
    return this.wellness.getLatest(req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get wellness statistics (averages, min/max)' })
  getStats(@Req() req: any, @Query('days') days?: string) {
    return this.wellness.getStats(req.user.id, days ? parseInt(days) : 7);
  }
}
