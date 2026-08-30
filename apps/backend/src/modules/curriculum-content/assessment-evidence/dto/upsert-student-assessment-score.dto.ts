import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export enum AssessmentScoreStatusDto {
  PENDING = 'PENDING',
  GRADED = 'GRADED',
  ABSENT = 'ABSENT',
  EXCUSED = 'EXCUSED',
}

export class UpsertStudentAssessmentScoreDto {
  @ApiProperty({ example: 'a3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  assessmentCloMappingId!: string;

  // The specific attempt, not just studentProfileId+courseId — a retake
  // gets its own StudentCourseRecord row and therefore its own
  // independent score here, never merged with a prior attempt.
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

  // Same redundant-but-verified courseId pattern as
  // CreateAssessmentCloMappingDto — see that file's comment.
  @ApiProperty({ example: 'c3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  courseId!: string;
}
