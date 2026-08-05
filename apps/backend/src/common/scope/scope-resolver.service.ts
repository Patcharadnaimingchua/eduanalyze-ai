import { Injectable, NotFoundException } from '@nestjs/common';
import { ScopeLevel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopeTargetEntity } from '../decorators/scope-target.decorator';

export interface ScopeAncestry {
  facultyId: string | null;
  departmentId: string | null;
  programId: string | null;
}

export interface EffectiveScope {
  level: ScopeLevel;
  facultyId: string | null;
  departmentId: string | null;
  programId: string | null;
}

// Leaf provider — depends only on PrismaService (global), never on
// DepartmentModule/ProgramModule/UserScopeModule, so ScopeModule can be
// imported back into those modules without a circular dependency.
@Injectable()
export class ScopeResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveAncestry(
    entity: ScopeTargetEntity,
    id: string,
  ): Promise<ScopeAncestry> {
    if (entity === 'faculty') {
      return { facultyId: id, departmentId: null, programId: null };
    }

    if (entity === 'department') {
      const department = await this.prisma.department.findUnique({
        where: { id },
        select: { facultyId: true },
      });
      if (!department) {
        throw new NotFoundException(`Department ${id} not found`);
      }
      return { facultyId: department.facultyId, departmentId: id, programId: null };
    }

    const program = await this.prisma.program.findUnique({
      where: { id },
      include: { department: { select: { facultyId: true } } },
    });
    if (!program) {
      throw new NotFoundException(`Program ${id} not found`);
    }
    return {
      facultyId: program.department.facultyId,
      departmentId: program.departmentId,
      programId: id,
    };
  }

  // Resolves scope live per CONVENTIONS.md §8 — a UserScope row pointing
  // at a since soft-deleted Faculty/Department/Program must not count.
  async getEffectiveScopes(userId: string): Promise<EffectiveScope[]> {
    const scopes = await this.prisma.userScope.findMany({
      where: { userId },
      include: { faculty: true, department: true, program: true },
    });

    return scopes
      .filter(
        (scope) =>
          scope.faculty?.isActive !== false &&
          scope.department?.isActive !== false &&
          scope.program?.isActive !== false,
      )
      .map((scope) => ({
        level: scope.level,
        facultyId: scope.facultyId,
        departmentId: scope.departmentId,
        programId: scope.programId,
      }));
  }
}
