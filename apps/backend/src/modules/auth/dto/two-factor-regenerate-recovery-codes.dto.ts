import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

// Reauth shape matches TwoFactorEnableDto (a live TOTP code, not the
// password change/disable uses) — kept as its own DTO/class rather than
// reused, since it backs a semantically different action.
export class TwoFactorRegenerateRecoveryCodesDto {
  @ApiProperty({ example: '123456', description: '6-digit code from the authenticator app' })
  @IsString()
  @Length(6, 6)
  code!: string;
}
