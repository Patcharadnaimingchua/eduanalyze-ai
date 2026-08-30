import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export enum MissingScorePolicyDto {
  EXCLUDE = 'EXCLUDE',
  TREAT_AS_ZERO = 'TREAT_AS_ZERO',
}

export class CreateAssessmentDefinitionDto {
  @ApiProperty({ example: 'Midterm Exam' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example: 'Exam',
    description:
      'Freeform category label (Quiz/Assignment/Exam/Project/...) — not an enum, see AssessmentDefinition schema comment.',
  })
  @IsString()
  @IsNotEmpty()
  kind!: string;

  @ApiProperty({ example: 100, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  maxScore!: number;

  @ApiPropertyOptional({ enum: MissingScorePolicyDto, default: MissingScorePolicyDto.EXCLUDE })
  @IsOptional()
  @IsEnum(MissingScorePolicyDto)
  missingScorePolicy?: MissingScorePolicyDto;

  @ApiProperty({ example: 'a3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  courseId!: string;

  @ApiProperty({ example: 'b3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  semesterId!: string;
}
