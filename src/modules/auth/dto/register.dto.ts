import { IsString, IsOptional, IsEmail, MinLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Иван Петрович' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'ivan@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+79991234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: ['WARD', 'GUARDIAN'], default: 'WARD' })
  @IsOptional()
  @IsEnum(['WARD', 'GUARDIAN'])
  role?: string;

  @ApiPropertyOptional({ example: 'ru', default: 'ru' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ example: 'Europe/Moscow' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
