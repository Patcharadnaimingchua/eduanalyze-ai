import type { AdminUserSummary, Role } from '@eduanalyze-ai/shared-types';
import { systemUserCounts, tierShares } from './system-overview';

function user(roles: Role[], isActive = true): AdminUserSummary {
  return { id: 'x', email: 'a@b.c', fullName: 'x', isActive, roles, scopes: [] } as never;
}

describe('tierShares', () => {
  it('counts each tier and rounds the share to one decimal', () => {
    const shares = tierShares([
      { dataState: 'HAS_STUDENTS' },
      { dataState: 'STRUCTURE_ONLY' },
      { dataState: 'EMPTY' },
    ]);
    expect(shares.map((s) => [s.state, s.count, s.percent])).toEqual([
      ['HAS_STUDENTS', 1, 33.3],
      ['STRUCTURE_ONLY', 1, 33.3],
      ['EMPTY', 1, 33.3],
    ]);
  });

  it('has no percentage when there are no curricula', () => {
    expect(tierShares([]).every((s) => s.count === 0 && s.percent === null)).toBe(true);
  });
});

describe('systemUserCounts', () => {
  it('ignores suspended accounts and adds the student count to the total', () => {
    const counts = systemUserCounts(
      [
        user(['SUPER_ADMIN']),
        user(['ADMIN']),
        user(['STAFF']),
        user(['STAFF'], false),
        user(['INSTRUCTOR']),
      ],
      10,
    );
    expect(counts).toEqual({
      superAdmin: 1,
      admin: 1,
      staff: 1,
      instructor: 1,
      student: 10,
      total: 14,
    });
  });
});
