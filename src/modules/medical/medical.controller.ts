import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MedicalService } from './medical.service';
import { CreateMedicalProfileDto } from './dto/create-medical-profile.dto';
import { CreateMedicationDto } from './dto/create-medication.dto';

@ApiTags('Medical')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/medical')
export class MedicalController {
  constructor(private medical: MedicalService) {}

  @Put('profile')
  @ApiOperation({ summary: 'Create or update medical profile' })
  upsertProfile(@Req() req: any, @Body() dto: CreateMedicalProfileDto) {
    return this.medical.upsertProfile(req.user.id, dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get medical profile' })
  getProfile(@Req() req: any) {
    return this.medical.getProfile(req.user.id);
  }

  @Post('medications')
  @ApiOperation({ summary: 'Add a medication' })
  addMedication(@Req() req: any, @Body() dto: CreateMedicationDto) {
    return this.medical.addMedication(req.user.id, dto);
  }

  @Get('medications')
  @ApiOperation({ summary: 'List active medications' })
  getMedications(@Req() req: any) {
    return this.medical.getMedications(req.user.id);
  }

  @Delete('medications/:id')
  @ApiOperation({ summary: 'Deactivate a medication' })
  deactivateMedication(@Req() req: any, @Param('id') id: string) {
    return this.medical.deactivateMedication(req.user.id, id);
  }

  @Get('adherence')
  @ApiOperation({ summary: 'Get medication adherence stats' })
  getAdherence(@Req() req: any, @Query('days') days?: string) {
    return this.medical.getMedicationAdherence(
      req.user.id,
      days ? parseInt(days) : 30,
    );
  }
}
