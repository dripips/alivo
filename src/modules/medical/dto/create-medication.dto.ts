import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicationDto {
  @ApiProperty({ example: 'Метформин' })
  @IsString()
  name: string;

  @ApiProperty({ example: '500mg' })
  @IsString()
  dosage: string;

  @ApiProperty({
    example: [
      { time: '08:00', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
      { time: '20:00', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
    ],
  })
  @IsArray()
  schedule: Array<{ time: string; days: string[] }>;

  @ApiPropertyOptional({ example: 'После еды' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({ example: '2026-05-15' })
  @IsString()
  startDate: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
