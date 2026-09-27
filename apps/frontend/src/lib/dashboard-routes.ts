import type { Role } from '@eduanalyze-ai/shared-types';
import { primaryRoleFor } from '@/lib/role-priority';

// Highest-privilege dashboard first — kept in one place so the login
// redirect and the landing-page "go to dashboard" button never disagree
// on where a given account's home is.
const ROLE_HOME: Record<Role, string> = {
  SUPER_ADMIN: '/admin/users',
  ADMIN: '/admin/overview',
  STAFF: '/staff/dashboard',
  INSTRUCTOR: '/instructor/dashboard',
  STUDENT: '/dashboard',
};

export function resolveHomeRoute(roles: Role[]): string {
  return ROLE_HOME[primaryRoleFor(roles)];
}
