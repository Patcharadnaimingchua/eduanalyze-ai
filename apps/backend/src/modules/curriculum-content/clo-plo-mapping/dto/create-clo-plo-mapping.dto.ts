import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class CreateCloPloMappingDto {
  @ApiProperty({ example: 'a3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  cloId!: string;

  @ApiProperty({ example: 'b4f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  ploId!: string;

  @ApiProperty({
    example: 3,
    minimum: 1,
    maximum: 5,
    description: 'Strength of the CLO→PLO relationship, 1 (weakest) to 5 (strongest).',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  weight!: number;
}
