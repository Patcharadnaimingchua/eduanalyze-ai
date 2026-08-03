import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateFacultyDto {
  @ApiProperty({ example: 'Faculty of Engineering' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'ENG' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;
}
