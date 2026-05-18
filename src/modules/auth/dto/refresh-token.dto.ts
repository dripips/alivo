import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-...' })
  @IsString()
  refreshToken: string;
}
