import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class CloScoreDto {
  @ApiProperty({ example: 'a3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  cloId!: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;
}

// courseId is not updatable — identifies which row is being revised, same
// shape as UpdateStudentCourseRecordDto. Replaces the whole cloScores set
// (not a partial patch of individual CLOs), matching the "submit once,
// revise the whole thing" decision.
export class UpdateCourseAssessmentDto {
  @ApiProperty({ type: [CloScoreDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CloScoreDto)
  cloScores!: CloScoreDto[];

  @ApiProperty({ example: 'Course นี้ช่วยให้เข้าใจการเขียนโปรแกรมมากขึ้น', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
