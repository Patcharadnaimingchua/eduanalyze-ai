import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class CreateAcademicYearDto {
  @ApiProperty({ example: 2568, description: 'Buddhist Era (พ.ศ.) year' })
  @IsInt()
  @Min(2500)
  @Max(2700)
  year!: number;
}
