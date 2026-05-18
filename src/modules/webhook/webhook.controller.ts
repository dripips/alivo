import {
  Controller, Get, Post, Delete,
  Body, Param, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsUrl } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebhookService } from './webhook.service';

class CreateWebhookDto {
  @ApiProperty({ example: 'https://example.com/webhook' })
  @IsUrl()
  url: string;

  @ApiProperty({ example: ['checkin.missed', 'sos.triggered', 'fraud.detected'] })
  @IsArray()
  @IsString({ each: true })
  events: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secret?: string;
}

@ApiTags('Webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/webhooks')
export class WebhookController {
  constructor(private webhooks: WebhookService) {}

  @Get()
  @ApiOperation({ summary: 'List active webhooks' })
  list(@Req() req: any) {
    return this.webhooks.getWebhooks(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create webhook subscription' })
  create(@Req() req: any, @Body() dto: CreateWebhookDto) {
    return this.webhooks.createWebhook(req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete webhook' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.webhooks.deleteWebhook(req.user.id, id);
  }
}
