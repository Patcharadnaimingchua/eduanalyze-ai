import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePrerequisiteDto {
  @ApiProperty({ example: 'a3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  courseId!: string;

  @ApiProperty({ example: 'b4f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  prerequisiteCourseId!: string;

  @ApiPropertyOptional({
    example: null,
    description:
      'Null = plain AND requirement. Rows sharing the same groupId will represent an OR group ("pass at least one") once that checker logic is built — reserved for future use, not evaluated yet.',
  })
  @IsOptional()
  @IsString()
  groupId?: string;
}
