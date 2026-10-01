import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { AssessmentScoreStatusDto } from './upsert-student-assessment-score.dto';

// Caps keep one all-or-nothing transaction bounded: 500 x 10 = 5000 upserts.
export const MAX_BULK_SCORE_ENTRIES = 500;
export const MAX_BULK_SCORE_MAPPINGS = 10;

export class BulkScoreEntryDto {
  @ApiProperty({ example: 'b3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  studentCourseRecordId!: string;

  @ApiPropertyOptional({
    example: 85,
    minimum: 0,
    description: 'Required when status is GRADED; must be omitted for every other status.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  score?: number;

  @ApiProperty({ enum: AssessmentScoreStatusDto })
  @IsEnum(AssessmentScoreStatusDto)
  status!: AssessmentScoreStatusDto;
}

export class BulkUpsertStudentAssessmentScoresDto {
  // Redundant-but-verified courseId, same pattern as the single upsert DTO.
  @ApiProperty({ example: 'c3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  courseId!: string;

  @ApiProperty({ example: 'd3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  assessmentDefinitionId!: string;

  @ApiProperty({
    type: [String],
    description: `Every CLO mapping of assessmentDefinitionId to write the entries to (1-${MAX_BULK_SCORE_MAPPINGS})`,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BULK_SCORE_MAPPINGS)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  assessmentCloMappingIds!: string[];

  @ApiProperty({
    type: [BulkScoreEntryDto],
    description: `One entry per student attempt (1-${MAX_BULK_SCORE_ENTRIES}); each is written to every mapping`,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BULK_SCORE_ENTRIES)
  @ValidateNested({ each: true })
  @Type(() => BulkScoreEntryDto)
  entries!: BulkScoreEntryDto[];
}
