import { BadRequestException, Injectable } from '@nestjs/common';
import { ScopeLevel } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { FacultyService } from '../../organization/faculty/faculty.service';
import { DepartmentService } from '../../organization/department/department.service';
import { ProgramService } from '../../organization/program/program.service';
import { UserService } from '../user/user.service';

@Injectable()
export class UserScopeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly facultyService: FacultyService,
    private readonly departmentService: DepartmentService,
    private readonly programService: ProgramService,
  ) {}

  // targetId is mapped onto exactly one of facultyId/departmentId/programId
  // based on level — this construction guarantees the XOR invariant (never
  // zero, never more than one FK set) by design, rather than validating it
  // after the fact.
  async assignScope(userId: string, level: ScopeLevel, targetId: string) {
    await this.userService.findById(userId);

    switch (level) {
      case ScopeLevel.FACULTY:
        await this.facultyService.findActiveByIdOrThrow(targetId);
        return this.prisma.userScope.create({
          data: { userId, level, facultyId: targetId },
        });
      case ScopeLevel.DEPARTMENT:
        await this.departmentService.findActiveByIdOrThrow(targetId);
        return this.prisma.userScope.create({
          data: { userId, level, departmentId: targetId },
        });
      case ScopeLevel.PROGRAM:
        await this.programService.findActiveByIdOrThrow(targetId);
        return this.prisma.userScope.create({
          data: { userId, level, programId: targetId },
        });
      default:
        throw new BadRequestException(`Unsupported scope level: ${level}`);
    }
  }
}
