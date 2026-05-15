import {
  Controller, Get, Post, Patch, Body, Param, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WalkSafetyService } from './walk-safety.service';

class StartWalkDto {
  @ApiProperty({ example: 60, description: 'Expected walk duration in minutes' })
  @IsNumber()
  expectedMinutes: number;

  @ApiPropertyOptional({ example: 55.7558 })
  @IsOptional() @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 37.6173 })
  @IsOptional() @IsNumber()
  longitude?: number;
}

class PingLocationDto {
  @ApiProperty({ example: 55.7560 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 37.6175 })
  @IsNumber()
  longitude: number;
}

@ApiTags('Walk Safety')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/walks')
export class WalkSafetyController {
  constructor(private walks: WalkSafetyService) {}

  @Post('start')
  @ApiOperation({ summary: '"I\'m going out" — start walk session with expected return time' })
  start(@Req() req: any, @Body() dto: StartWalkDto) {
    return this.walks.startWalk(req.user.id, dto);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active walk session' })
  getActive(@Req() req: any) {
    return this.walks.getActiveWalk(req.user.id);
  }

  @Patch(':id/ping')
  @ApiOperation({ summary: 'Update location during walk' })
  ping(@Param('id') id: string, @Body() dto: PingLocationDto) {
    return this.walks.pingLocation(id, dto.latitude, dto.longitude);
  }

  @Patch(':id/end')
  @ApiOperation({ summary: '"I\'m back home" — end walk session' })
  end(@Req() req: any, @Param('id') id: string) {
    return this.walks.endWalk(req.user.id, id);
  }
}
