import { ApiProperty } from '@nestjs/swagger';
import { SemesterTerm } from '@prisma/client';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  Max,
  Min,
} from 'class-validator';

export const MAX_BULK_ACADEMIC_YEARS = 10;

export class BulkCreateAcademicYearsDto {
  @ApiProperty({ example: 2570, description: 'First year (พ.ศ.)' })
  @IsInt()
  @Min(2500)
  @Max(2700)
  startYear!: number;

  @ApiProperty({
    example: 4,
    description: `Number of consecutive years (1-${MAX_BULK_ACADEMIC_YEARS}); last year must stay within 2700`,
  })
  @IsInt()
  @Min(1)
  @Max(MAX_BULK_ACADEMIC_YEARS)
  yearCount!: number;

  @ApiProperty({
    enum: SemesterTerm,
    isArray: true,
    example: [SemesterTerm.FIRST, SemesterTerm.SECOND],
    description: 'Terms to create in every year; empty = years only',
  })
  @IsArray()
  @ArrayUnique()
  @IsEnum(SemesterTerm, { each: true })
  terms!: SemesterTerm[];
}
