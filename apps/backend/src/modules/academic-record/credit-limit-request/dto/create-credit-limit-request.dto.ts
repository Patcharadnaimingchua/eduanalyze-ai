import { ApiProperty } from '@nestjs/swagger';
import { CreditLimitRequestType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCreditLimitRequestDto {
  @ApiProperty({ enum: CreditLimitRequestType, example: CreditLimitRequestType.EXCEED_MAX })
  @IsEnum(CreditLimitRequestType)
  type!: CreditLimitRequestType;

  @ApiProperty({ example: 'ชั้นปีสุดท้าย ต้องการเก็บวิชาให้จบตามกำหนด' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason!: string;
}
