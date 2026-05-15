import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({ example: 'Мария Петровна (дочь)' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '+79991234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'maria@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ enum: ['TELEGRAM', 'VK_MAX', 'WEB'] })
  @IsOptional()
  @IsEnum(['TELEGRAM', 'VK_MAX', 'WEB'])
  channel?: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsOptional()
  @IsString()
  channelId?: string;

  @ApiPropertyOptional({ example: 0, description: '0 = highest priority' })
  @IsOptional()
  @IsInt()
  priority?: number;
}
