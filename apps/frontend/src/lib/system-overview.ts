import type { AdminUserSummary, CurriculumDataState } from '@eduanalyze-ai/shared-types';
import { summarizeUsers } from '@/lib/admin-users';

export const TIER_ORDER: CurriculumDataState[] = ['HAS_STUDENTS', 'STRUCTURE_ONLY', 'EMPTY'];

export interface TierShare {
  state: CurriculumDataState;
  count: number;
  // One decimal, null when there is nothing to divide by.
  percent: number | null;
}

export function tierShares(entries: readonly { dataState: CurriculumDataState }[]): TierShare[] {
  const total = entries.length;
  return TIER_ORDER.map((state) => {
    const count = entries.filter((entry) => entry.dataState === state).length;
    return { state, count, percent: total === 0 ? null : Math.round((count / total) * 1000) / 10 };
  });
}

export interface SystemUserCounts {
  superAdmin: number;
  admin: number;
  staff: number;
  instructor: number;
  student: number;
  total: number;
}

// Only accounts that can sign in count; students are not in GET /users, so
// their number comes from the curriculum report.
export function systemUserCounts(
  users: readonly AdminUserSummary[],
  studentCount: number,
): SystemUserCounts {
  const { byRole } = summarizeUsers(users.filter((user) => user.isActive));
  const counts = {
    superAdmin: byRole.SUPER_ADMIN,
    admin: byRole.ADMIN,
    staff: byRole.STAFF,
    instructor: byRole.INSTRUCTOR,
    student: studentCount,
  };
  return {
    ...counts,
    total: counts.superAdmin + counts.admin + counts.staff + counts.instructor + counts.student,
  };
}
