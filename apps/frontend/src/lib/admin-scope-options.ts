import type { ScopeLevel, UserScope } from '@eduanalyze-ai/shared-types';

// Which organisation units an Admin may name as the scope of a new account:
// only units inside their own scope. Mirrors the rule behind isScopeCovered
// (admin-user-guard.ts), but over the whole org tree instead of one scope; the
// API stays the authority and still answers 403 for anything outside.

export interface ScopeOrg {
  faculties: { id: string; isActive: boolean }[];
  departments: { id: string; facultyId: string; isActive: boolean }[];
  programs: { id: string; departmentId: string; isActive: boolean }[];
}

export type AllowedScopeTargets = Record<ScopeLevel, Set<string>>;

export const SCOPE_LEVEL_ORDER: ScopeLevel[] = ['FACULTY', 'DEPARTMENT', 'PROGRAM'];

export function allowedScopeTargets(
  ownScopes: readonly Pick<UserScope, 'level' | 'facultyId' | 'departmentId' | 'programId'>[],
  org: ScopeOrg,
): AllowedScopeTargets {
  const ownFaculties = new Set<string>();
  const ownDepartments = new Set<string>();
  const ownPrograms = new Set<string>();
  for (const scope of ownScopes) {
    if (scope.level === 'FACULTY' && scope.facultyId) ownFaculties.add(scope.facultyId);
    if (scope.level === 'DEPARTMENT' && scope.departmentId) ownDepartments.add(scope.departmentId);
    if (scope.level === 'PROGRAM' && scope.programId) ownPrograms.add(scope.programId);
  }

  const allowed: AllowedScopeTargets = {
    FACULTY: new Set(),
    DEPARTMENT: new Set(),
    PROGRAM: new Set(),
  };
  // A faculty can only be granted by someone who holds that whole faculty.
  for (const faculty of org.faculties) {
    if (faculty.isActive && ownFaculties.has(faculty.id)) allowed.FACULTY.add(faculty.id);
  }
  const departmentById = new Map(org.departments.map((d) => [d.id, d]));
  for (const department of org.departments) {
    if (
      department.isActive &&
      (ownFaculties.has(department.facultyId) || ownDepartments.has(department.id))
    ) {
      allowed.DEPARTMENT.add(department.id);
    }
  }
  for (const program of org.programs) {
    const department = departmentById.get(program.departmentId);
    if (
      program.isActive &&
      (ownPrograms.has(program.id) ||
        ownDepartments.has(program.departmentId) ||
        (department !== undefined && ownFaculties.has(department.facultyId)))
    ) {
      allowed.PROGRAM.add(program.id);
    }
  }
  return allowed;
}

// Levels that still have at least one unit to pick, in the usual order.
export function allowedLevels(allowed: AllowedScopeTargets): ScopeLevel[] {
  return SCOPE_LEVEL_ORDER.filter((level) => allowed[level].size > 0);
}
