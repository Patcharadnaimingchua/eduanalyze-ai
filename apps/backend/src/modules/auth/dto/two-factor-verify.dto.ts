import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

// Deliberately not length-constrained like TwoFactorEnableDto's 6-digit
// code — this accepts either a live TOTP code (6 digits) or a recovery
// code ("XXXX-XXXX"), and TwoFactorService.verifyLoginCode tells them
// apart by shape.
export class TwoFactorVerifyDto {
  @ApiProperty({ example: '123456', description: 'TOTP code or a recovery code (XXXX-XXXX)' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}
