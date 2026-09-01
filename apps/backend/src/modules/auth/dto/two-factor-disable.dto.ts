import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TwoFactorDisableDto {
  @ApiProperty({ example: 'CurrentP@ssw0rd123' })
  @IsString()
  password!: string;
}
