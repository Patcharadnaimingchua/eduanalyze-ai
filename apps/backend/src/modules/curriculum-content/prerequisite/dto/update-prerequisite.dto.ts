import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

// Only groupId is updatable — courseId/prerequisiteCourseId identify the
// row itself (delete + recreate to change either of those, not update).
export class UpdatePrerequisiteDto {
  @ApiPropertyOptional({
    example: 'group-1',
    description: 'Assign/reassign this prerequisite to an OR group.',
  })
  @IsOptional()
  @IsString()
  groupId?: string;
}
