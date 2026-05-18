import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiProperty,
} from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

class UpdateAiSettingsDto {
  @ApiProperty({ required: false, description: 'AI provider API key' })
  @IsOptional()
  @IsString()
  AI_API_KEY?: string;

  @ApiProperty({ required: false, description: 'AI provider base URL' })
  @IsOptional()
  @IsString()
  AI_BASE_URL?: string;

  @ApiProperty({ required: false, description: 'AI model name' })
  @IsOptional()
  @IsString()
  AI_MODEL?: string;
}

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('api/admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform statistics (users, check-ins, AI usage, subscriptions)' })
  getStats() {
    return this.admin.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Paginated user list' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.admin.getUsers(page, limit);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Detailed user info with all relations' })
  getUser(@Param('id') id: string) {
    return this.admin.getUser(id);
  }

  @Get('ai/settings')
  @ApiOperation({ summary: 'Current AI provider settings (API key masked)' })
  getAiSettings() {
    return this.admin.getAiSettings();
  }

  @Put('ai/settings')
  @ApiOperation({ summary: 'Update AI provider settings' })
  updateAiSettings(@Body() dto: UpdateAiSettingsDto) {
    return this.admin.updateAiSettings(dto);
  }

  @Get('ai/costs')
  @ApiOperation({ summary: 'AI cost summary for period' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getAiCosts(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.admin.getAiCostSummary(days);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Soft-delete user (set isActive=false)' })
  deleteUser(@Param('id') id: string) {
    return this.admin.deleteUser(id);
  }
}
