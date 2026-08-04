import { ApiProperty } from '@nestjs/swagger';
import { SemesterTerm } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class CreateSemesterDto {
  @ApiProperty({ enum: SemesterTerm, example: SemesterTerm.FIRST })
  @IsEnum(SemesterTerm)
  term!: SemesterTerm;

  @ApiProperty({ example: 'a3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  academicYearId!: string;
}
