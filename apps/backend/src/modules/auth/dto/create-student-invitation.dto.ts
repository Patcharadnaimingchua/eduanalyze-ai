import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsInt, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateStudentInvitationDto {
  @ApiProperty({ example: 'incoming-student@example.ac.th' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Somchai Jaidee' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: '6712345678' })
  @IsString()
  @IsNotEmpty()
  studentCode!: string;

  @ApiProperty({ example: 'a3f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  programId!: string;

  @ApiProperty({ example: 'b4f1c2e4-1234-4a5b-9c6d-7e8f9a0b1c2d' })
  @IsUUID()
  curriculumId!: string;

  @ApiProperty({ example: 2027 })
  @IsInt()
  admissionYear!: number;
}
