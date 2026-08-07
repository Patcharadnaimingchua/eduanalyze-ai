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

  private static readonly LEVEL_TO_ENTITY: Record<ScopeLevel, ScopeTargetEntity> = {
    FACULTY: 'faculty',
    DEPARTMENT: 'department',
    PROGRAM: 'program',
  };

  // Small convenience over resolveAncestry for callers that only have a
  // ScopeLevel (e.g. UserScope's level column) rather than a statically
  // known ScopeTargetEntity — avoids the FACULTY/DEPARTMENT/PROGRAM →
  // faculty/department/program mapping being re-derived in every caller
  // (Module 12's UserManagementService and UserScopeService both need it).
  async resolveAncestryForLevel(
    level: ScopeLevel,
    id: string,
  ): Promise<ScopeAncestry> {
    return this.resolveAncestry(ScopeResolverService.LEVEL_TO_ENTITY[level], id);
  }

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

    if (entity === 'program') {
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

    // Everything below Program delegates to the 'program' branch above for
    // the Department/Faculty walk-up, after one query to find its own
    // programId — reuse over duplicating the walk-up logic (CONVENTIONS
    // §6), at the cost of one extra query per resolution (single-row
    // mutation-time lookups, not a list endpoint, so this is cheap).

    if (entity === 'curriculum') {
      const curriculum = await this.prisma.curriculum.findUnique({
        where: { id },
        select: { programId: true },
      });
      if (!curriculum) {
        throw new NotFoundException(`Curriculum ${id} not found`);
      }
      return this.resolveAncestry('program', curriculum.programId);
    }

    if (entity === 'course') {
      const course = await this.prisma.course.findUnique({
        where: { id },
        select: { curriculum: { select: { programId: true } } },
      });
      if (!course) {
        throw new NotFoundException(`Course ${id} not found`);
      }
      return this.resolveAncestry('program', course.curriculum.programId);
    }

    if (entity === 'plo') {
      const plo = await this.prisma.plo.findUnique({
        where: { id },
        select: { curriculum: { select: { programId: true } } },
      });
      if (!plo) {
        throw new NotFoundException(`Plo ${id} not found`);
      }
      return this.resolveAncestry('program', plo.curriculum.programId);
    }

    if (entity === 'clo') {
      const clo = await this.prisma.clo.findUnique({
        where: { id },
        select: { course: { select: { curriculum: { select: { programId: true } } } } },
      });
      if (!clo) {
        throw new NotFoundException(`Clo ${id} not found`);
      }
      return this.resolveAncestry('program', clo.course.curriculum.programId);
    }

    if (entity === 'cloPloMapping') {
      const mapping = await this.prisma.cloPloMapping.findUnique({
        where: { id },
        select: { plo: { select: { curriculum: { select: { programId: true } } } } },
      });
      if (!mapping) {
        throw new NotFoundException(`CloPloMapping ${id} not found`);
      }
      return this.resolveAncestry('program', mapping.plo.curriculum.programId);
    }

    if (entity === 'courseCategory') {
      const category = await this.prisma.courseCategory.findUnique({
        where: { id },
        select: { curriculum: { select: { programId: true } } },
      });
      if (!category) {
        throw new NotFoundException(`CourseCategory ${id} not found`);
      }
      return this.resolveAncestry('program', category.curriculum.programId);
    }

    if (entity === 'curriculumRequirement') {
      const requirement = await this.prisma.curriculumRequirement.findUnique({
        where: { id },
        select: { curriculum: { select: { programId: true } } },
      });
      if (!requirement) {
        throw new NotFoundException(`CurriculumRequirement ${id} not found`);
      }
      return this.resolveAncestry('program', requirement.curriculum.programId);
    }

    if (entity === 'prerequisite') {
      const prerequisite = await this.prisma.prerequisite.findUnique({
        where: { id },
        select: { course: { select: { curriculum: { select: { programId: true } } } } },
      });
      if (!prerequisite) {
        throw new NotFoundException(`Prerequisite ${id} not found`);
      }
      return this.resolveAncestry('program', prerequisite.course.curriculum.programId);
    }

    // entity === 'studentProfile' — StudentProfile has a direct programId
    // column (no curriculum hop needed), unlike every branch above.
    const profile = await this.prisma.studentProfile.findUnique({
      where: { id },
      select: { programId: true },
    });
    if (!profile) {
      throw new NotFoundException(`Student profile ${id} not found`);
    }
    return this.resolveAncestry('program', profile.programId);
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

  // Hierarchical containment check — FACULTY scope covers every child
  // Department/Program, DEPARTMENT scope covers every child Program.
  // Shared by ScopeGuard and by Module 12's user-creation/scope-granting
  // logic so the hierarchy rule lives in exactly one place.
  isCovered(target: ScopeAncestry, effectiveScopes: EffectiveScope[]): boolean {
    return effectiveScopes.some(
      (scope) =>
        (scope.level === 'FACULTY' && scope.facultyId === target.facultyId) ||
        (scope.level === 'DEPARTMENT' &&
          scope.departmentId === target.departmentId) ||
        (scope.level === 'PROGRAM' && scope.programId === target.programId),
    );
  }

  // For query-level list filtering (CONVENTIONS §3a: never fetch-all-then-
  // filter-in-memory) — expands effective scopes down to concrete Program
  // ids, since a FACULTY/DEPARTMENT-level scope covers every Program under
  // it, not just a literal programId column.
  async getCoveredProgramIds(userId: string): Promise<string[]> {
    const effectiveScopes = await this.getEffectiveScopes(userId);
    const programIds = new Set<string>();

    for (const scope of effectiveScopes) {
      if (scope.level === 'PROGRAM') {
        programIds.add(scope.programId!);
      } else if (scope.level === 'DEPARTMENT') {
        const programs = await this.prisma.program.findMany({
          where: { departmentId: scope.departmentId!, isActive: true },
          select: { id: true },
        });
        programs.forEach((p) => programIds.add(p.id));
      } else if (scope.level === 'FACULTY') {
        const programs = await this.prisma.program.findMany({
          where: { department: { facultyId: scope.facultyId! }, isActive: true },
          select: { id: true },
        });
        programs.forEach((p) => programIds.add(p.id));
      }
    }

    return [...programIds];
  }
}
