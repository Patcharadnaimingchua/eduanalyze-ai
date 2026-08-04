import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID } from 'class-validator';

export class CreateCurriculumRequirementDto {
  @ApiProperty({ example: 'a3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  curriculumId!: string;

  @ApiProperty({ example: 'b4f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ example: 30 })
  @IsInt()
  minCredits!: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  minCourses?: number;
}
