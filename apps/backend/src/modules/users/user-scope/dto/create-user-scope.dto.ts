import { ApiProperty } from '@nestjs/swagger';
import { ScopeLevel } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class CreateUserScopeDto {
  @ApiProperty({ enum: ScopeLevel, example: ScopeLevel.DEPARTMENT })
  @IsEnum(ScopeLevel)
  level!: ScopeLevel;

  @ApiProperty({ example: 'a3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  targetId!: string;
}
