import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCurriculumDto {
  @ApiProperty({ example: 'a3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  @IsNotEmpty()
  programId!: string;

  @ApiProperty({ example: '2026' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  version!: string;

  @ApiProperty({ example: 2026 })
  @IsInt()
  effectiveYear!: number;

  @ApiProperty({ example: 132 })
  @IsInt()
  totalCredits!: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isOpenForRegistration?: boolean;

  @ApiPropertyOptional({ example: 70, default: 70, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  defaultAchievementThreshold?: number;
}
