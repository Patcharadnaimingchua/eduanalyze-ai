import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateAssessmentCloMappingDto {
  @ApiProperty({ example: 'a3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  assessmentDefinitionId!: string;

  @ApiProperty({ example: 'b3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  cloId!: string;

  // Weight of this assessment toward THIS CLO — never confuse with
  // CloPloMapping.weight (this CLO's weight toward a PLO, one level up).
  // Must be > 0; not required to sum to 100 across a CLO's mappings —
  // the calculation normalizes by the sum of weights actually used.
  @ApiProperty({ example: 2, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  weight!: number;

  @ApiPropertyOptional({
    example: 40,
    minimum: 0.01,
    description:
      "Overrides AssessmentDefinition.maxScore for this CLO's slice of the assessment. Omit to use the assessment's own maxScore.",
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  maxScoreOverride?: number;

  // Required here too (redundant with the parent AssessmentDefinition's
  // own courseId) purely so InstructorOrScopeGuard can authorize this
  // route the same declarative way every other course-scoped write does
  // — the service still independently verifies assessmentDefinitionId
  // actually belongs to this courseId (404 if not), so a mismatched
  // value here can never grant access to the wrong course.
  @ApiProperty({ example: 'c3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  courseId!: string;
}
