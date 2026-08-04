import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePloDto {
  @ApiProperty({ example: 'PLO1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @ApiProperty({ example: 'บูรณาการความรู้ทางไอที' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    example: 'ประยุกต์ใช้แนวคิด ทฤษฎี หลักการทางเทคโนโลยีสารสนเทศแก้ปัญหาได้',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'a3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  curriculumId!: string;
}
