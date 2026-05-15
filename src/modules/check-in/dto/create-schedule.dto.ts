import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduleDto {
  @ApiProperty({ example: ['08:00', '14:00', '21:00'] })
  @IsArray()
  @IsString({ each: true })
  times: string[];

  @ApiProperty({ example: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] })
  @IsArray()
  @IsString({ each: true })
  days: string[];
}
