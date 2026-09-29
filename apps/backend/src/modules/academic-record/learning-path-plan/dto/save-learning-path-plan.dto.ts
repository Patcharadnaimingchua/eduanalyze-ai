import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class SaveLearningPathPlanDto {
  @ApiProperty({
    type: [String],
    description: 'Planned course ids in display order; replaces the whole saved plan',
  })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  courseIds!: string[];
}
