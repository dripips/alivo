import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SosService } from './sos.service';

class TriggerSosDto {
  @ApiPropertyOptional({ example: 55.7558 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 37.6173 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'Мне плохо, нужна помощь' })
  @IsOptional()
  @IsString()
  message?: string;
}

@ApiTags('SOS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/sos')
export class SosController {
  constructor(private sos: SosService) {}

  @Post()
  @ApiOperation({ summary: 'Trigger SOS — instant alert to all contacts with location' })
  trigger(@Req() req: any, @Body() dto: TriggerSosDto) {
    return this.sos.trigger(req.user.id, dto);
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Mark SOS as resolved' })
  resolve(@Req() req: any, @Param('id') id: string) {
    return this.sos.resolve(id, req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'SOS alert history' })
  history(@Req() req: any) {
    return this.sos.getHistory(req.user.id);
  }
}
