import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmergencyCardService } from './emergency-card.service';

@ApiTags('Emergency Card')
@Controller('api/emergency-card')
export class EmergencyCardController {
  constructor(private card: EmergencyCardService) {}

  @Get(':token')
  @ApiOperation({
    summary: 'View emergency card (NO AUTH — for first responders via QR code)',
  })
  getCard(@Param('token') token: string) {
    return this.card.getCardByToken(token);
  }

  @Post('generate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate or regenerate emergency card token' })
  generate(@Req() req: any) {
    return this.card.generateToken(req.user.id);
  }

  @Get('my/info')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my emergency card link' })
  getMyCard(@Req() req: any) {
    return this.card.getMyCard(req.user.id);
  }
}
