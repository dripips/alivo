import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
} from '@nestjs/swagger';
import { IsString, IsNotEmpty, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PushService } from './push.service';

class PushSubscriptionKeysDto {
  @ApiProperty({ description: 'p256dh key from PushSubscription' })
  @IsString()
  @IsNotEmpty()
  p256dh: string;

  @ApiProperty({ description: 'auth key from PushSubscription' })
  @IsString()
  @IsNotEmpty()
  auth: string;
}

class SubscribePushDto {
  @ApiProperty({ description: 'Push subscription endpoint URL' })
  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @ApiProperty({ type: PushSubscriptionKeysDto })
  @ValidateNested()
  @Type(() => PushSubscriptionKeysDto)
  keys: PushSubscriptionKeysDto;
}

class UnsubscribePushDto {
  @ApiProperty({ description: 'Push subscription endpoint URL to remove' })
  @IsString()
  @IsNotEmpty()
  endpoint: string;
}

@ApiTags('Push Notifications')
@Controller('api/push')
export class PushController {
  constructor(private push: PushService) {}

  @Get('vapid-key')
  @ApiOperation({ summary: 'Get VAPID public key for push subscription' })
  async getVapidKey() {
    const publicKey = await this.push.getPublicKey();
    return { publicKey };
  }

  @Post('subscribe')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Register a push subscription for the current user' })
  subscribe(@Req() req: any, @Body() dto: SubscribePushDto) {
    return this.push.subscribe(req.user.id, dto);
  }

  @Delete('unsubscribe')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove a push subscription' })
  unsubscribe(@Req() req: any, @Body() dto: UnsubscribePushDto) {
    return this.push.unsubscribe(req.user.id, dto.endpoint);
  }

  @Post('test')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send a test push notification to yourself' })
  async testPush(@Req() req: any) {
    return this.push.sendNotification(
      req.user.id,
      'Test Notification',
      'Push notifications are working correctly.',
      { type: 'test' },
    );
  }
}
