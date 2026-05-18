import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanionService } from './companion.service';
import { UsageService } from '../billing/usage.service';

@ApiTags('Companion')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/companion')
export class CompanionController {
  constructor(
    private companion: CompanionService,
    private usage: UsageService,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: 'Send a message to the AI companion (web channel)' })
  async chat(@Req() req: any, @Body() body: { message: string }) {
    await this.usage.enforceQuota(req.user.id, 'ai_message');

    const reply = await this.companion.chat(req.user.id, body.message, 'WEB');

    await this.usage.track(req.user.id, 'ai_message', {
      channel: 'WEB',
      messageLength: body.message.length,
    });

    return { reply };
  }
}
