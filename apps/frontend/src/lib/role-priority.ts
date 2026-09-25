import type { Role } from '@eduanalyze-ai/shared-types';

// Highest privilege first — used wherever a multi-role account (e.g. a
// bootstrapped STUDENT+SUPER_ADMIN, or a STAFF+INSTRUCTOR account) needs one
// "primary" role picked out of several: login redirect target, badge/label
// choice, etc. STAFF ranks above INSTRUCTOR because PROJECT_CONTEXT.md §10
// gives STAFF authority over Instructor Assignment itself — a broader
// operational scope than INSTRUCTOR's own course-only read access (§9).
export const ROLE_PRIORITY: Role[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'STAFF',
  'INSTRUCTOR',
  'STUDENT',
];

export function primaryRoleFor(roles: Role[]): Role {
  return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? 'STUDENT';
}
