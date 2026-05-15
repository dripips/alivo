import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicalProfileDto {
  @ApiPropertyOptional({ example: ['diabetes_type2', 'hypertension'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  conditions?: string[];

  @ApiPropertyOptional({ example: ['penicillin'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({ example: 'II+' })
  @IsOptional()
  @IsString()
  bloodType?: string;

  @ApiPropertyOptional({ example: 'Смирнова А.В.' })
  @IsOptional()
  @IsString()
  doctorName?: string;

  @ApiPropertyOptional({ example: '+79991234567' })
  @IsOptional()
  @IsString()
  doctorPhone?: string;

  @ApiPropertyOptional({ example: 'Инсулин в холодильнике, 2й ящик' })
  @IsOptional()
  @IsString()
  notes?: string;
}
