import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/dashboard')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Guardian overview — all wards status' })
  getOverview(@Req() req: any) {
    return this.dashboard.getGuardianOverview(req.user.id);
  }

  @Get('ward/:wardId')
  @ApiOperation({ summary: 'Detailed ward dashboard' })
  getWardDashboard(@Req() req: any, @Param('wardId') wardId: string) {
    return this.dashboard.getWardDashboard(req.user.id, wardId);
  }
}
