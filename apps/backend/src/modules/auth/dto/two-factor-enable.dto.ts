import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class TwoFactorEnableDto {
  @ApiProperty({ example: '123456', description: '6-digit code from the authenticator app' })
  @IsString()
  @Length(6, 6)
  code!: string;
}
