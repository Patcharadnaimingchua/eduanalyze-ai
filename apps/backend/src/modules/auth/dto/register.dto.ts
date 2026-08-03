import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'student@example.ac.th' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'P@ssw0rd123' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password!: string;

  @ApiProperty({ example: 'Somchai Jaidee' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName!: string;

  @ApiProperty({ example: '6512345678' })
  @IsString()
  @IsNotEmpty()
  studentCode!: string;

  @ApiProperty({ example: 'a3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  programId!: string;

  @ApiProperty({ example: 'b4f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  curriculumId!: string;

  @ApiProperty({ example: 2026 })
  @IsInt()
  admissionYear!: number;
}
