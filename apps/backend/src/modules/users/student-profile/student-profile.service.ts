import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaClientOrTx } from '../../../prisma/prisma.types';
import { ProgramService } from '../../organization/program/program.service';
import { CurriculumService } from '../../organization/curriculum/curriculum.service';
import { UserRoleService } from '../user-role/user-role.service';

@Injectable()
export class StudentProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userRoleService: UserRoleService,
    private readonly programService: ProgramService,
    private readonly curriculumService: CurriculumService,
  ) {}

  async create(
    userId: string,
    studentCode: string,
    programId: string,
    curriculumId: string,
    admissionYear: number,
    tx: PrismaClientOrTx = this.prisma,
  ) {
    const hasStudentRole = await this.userRoleService.hasRole(
      userId,
      Role.STUDENT,
      tx,
    );
    if (!hasStudentRole) {
      throw new BadRequestException(
        `User ${userId} does not have the STUDENT role assigned yet`,
      );
    }

    await this.programService.findActiveByIdOrThrow(programId, tx);
    const curriculum = await this.curriculumService.findActiveByIdOrThrow(
      curriculumId,
      tx,
    );

    // The DB compound FK (programId, curriculumId) -> Curriculum(programId, id)
    // would reject a mismatch anyway, but checking here first gives a clear
    // error message instead of a raw Prisma foreign-key-violation.
    if (curriculum.programId !== programId) {
      throw new BadRequestException(
        `Curriculum ${curriculumId} does not belong to program ${programId}`,
      );
    }

    try {
      return await tx.studentProfile.create({
        data: { userId, studentCode, programId, curriculumId, admissionYear },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `User ${userId} already has a student profile, or student code "${studentCode}" is already in use`,
        );
      }
      throw error;
    }
  }
}
