import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({ enum: Role, example: Role.STAFF })
  @IsEnum(Role)
  role!: Role;
}
