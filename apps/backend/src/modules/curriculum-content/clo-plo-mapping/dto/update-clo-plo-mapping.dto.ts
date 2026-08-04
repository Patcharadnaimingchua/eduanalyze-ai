import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Only weight is updatable — cloId/ploId identify the row itself (delete +
// recreate to change either of those, not update), matching the
// UpdatePrerequisiteDto pattern.
export class UpdateCloPloMappingDto {
  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  weight?: number;
}
