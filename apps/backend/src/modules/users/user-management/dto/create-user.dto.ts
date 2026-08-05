import { ApiProperty } from '@nestjs/swagger';
import { Role, ScopeLevel } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Present as its own class (not two loose fields) so @ValidateNested can
// validate level/targetId together, and so the "required when the
// requester is ADMIN" rule (a cross-field, requester-dependent business
// rule — not expressible in class-validator alone) has one clear optional
// slot to check in the service layer.
class InitialScopeDto {
  @ApiProperty({ enum: ScopeLevel, example: ScopeLevel.DEPARTMENT })
  @IsEnum(ScopeLevel)
  level!: ScopeLevel;

  @ApiProperty({ example: 'a3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  targetId!: string;
}

export class CreateUserDto {
  @ApiProperty({ example: 'staff@example.ac.th' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Somchai Jaidee' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName!: string;

  // STUDENT is deliberately not accepted here — /auth/register is the
  // only path that may create a STUDENT account (see CONVENTIONS.md §6:
  // never a second code path producing the same result). Enforced in the
  // service layer since it depends on the value, not just its type.
  @ApiProperty({ enum: Role, example: Role.STAFF })
  @IsEnum(Role)
  role!: Role;

  // Optional at the DTO level — required-when-requester-is-ADMIN is a
  // business rule enforced in UserManagementService, not here.
  @ApiProperty({ type: InitialScopeDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => InitialScopeDto)
  scope?: InitialScopeDto;
}
