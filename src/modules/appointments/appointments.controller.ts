import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppointmentsService } from './appointments.service';

class CreateAppointmentDto {
  @ApiProperty({ example: 'Приём у кардиолога' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Плановый осмотр, ЭКГ' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Поликлиника №5, каб. 305' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Смирнова А.В.' })
  @IsOptional()
  @IsString()
  doctorName?: string;

  @ApiProperty({ example: '2026-05-20T10:00:00Z' })
  @IsString()
  scheduledAt: string;

  @ApiPropertyOptional({ example: 60, description: 'Remind N minutes before' })
  @IsOptional()
  @IsInt()
  remindBefore?: number;

  @ApiPropertyOptional({ example: 'Взять полис, результаты анализов, список лекарств' })
  @IsOptional()
  @IsString()
  notes?: string;
}

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/appointments')
export class AppointmentsController {
  constructor(private appointments: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create appointment / reminder' })
  create(@Req() req: any, @Body() dto: CreateAppointmentDto) {
    return this.appointments.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all appointments' })
  getAll(@Req() req: any) {
    return this.appointments.getAll(req.user.id);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming appointments' })
  getUpcoming(@Req() req: any) {
    return this.appointments.getUpcoming(req.user.id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark appointment as completed' })
  complete(@Req() req: any, @Param('id') id: string) {
    return this.appointments.complete(req.user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete appointment' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.appointments.delete(req.user.id, id);
  }
}
