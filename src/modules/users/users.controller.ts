import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile with all relations' })
  getMe(@Req() req: any) {
    return this.users.findById(req.user.id);
  }

  @Get('me/wards')
  @ApiOperation({ summary: 'Get wards (for guardians)' })
  getMyWards(@Req() req: any) {
    return this.users.getWards(req.user.id);
  }
}
