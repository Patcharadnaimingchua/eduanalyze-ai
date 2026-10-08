import type { UserScope } from '@eduanalyze-ai/shared-types';
import {
  allActiveScopeTargets,
  allowedLevels,
  allowedScopeTargets,
  excludeHeldScopes,
  type ScopeOrg,
} from './admin-scope-options';

const ORG: ScopeOrg = {
  faculties: [
    { id: 'f1', isActive: true },
    { id: 'f2', isActive: true },
  ],
  departments: [
    { id: 'd1', facultyId: 'f1', isActive: true },
    { id: 'd2', facultyId: 'f1', isActive: false },
    { id: 'd3', facultyId: 'f2', isActive: true },
  ],
  programs: [
    { id: 'p1', departmentId: 'd1', isActive: true },
    { id: 'p2', departmentId: 'd3', isActive: true },
    { id: 'p3', departmentId: 'd1', isActive: false },
  ],
};

const scope = (s: Partial<UserScope> & Pick<UserScope, 'level'>) =>
  ({ facultyId: null, departmentId: null, programId: null, ...s }) as UserScope;

const ids = (set: Set<string>) => [...set].sort();

describe('allowedScopeTargets', () => {
  it('a faculty scope covers that faculty, its departments and programs only', () => {
    const a = allowedScopeTargets([scope({ level: 'FACULTY', facultyId: 'f1' })], ORG);
    expect(ids(a.FACULTY)).toEqual(['f1']);
    expect(ids(a.DEPARTMENT)).toEqual(['d1']); // d2 inactive, d3 other faculty
    expect(ids(a.PROGRAM)).toEqual(['p1']); // p3 inactive, p2 other faculty
    expect(allowedLevels(a)).toEqual(['FACULTY', 'DEPARTMENT', 'PROGRAM']);
  });

  it('a department scope cannot grant its faculty', () => {
    const a = allowedScopeTargets([scope({ level: 'DEPARTMENT', departmentId: 'd1' })], ORG);
    expect(a.FACULTY.size).toBe(0);
    expect(ids(a.DEPARTMENT)).toEqual(['d1']);
    expect(ids(a.PROGRAM)).toEqual(['p1']);
    expect(allowedLevels(a)).toEqual(['DEPARTMENT', 'PROGRAM']);
  });

  it('a program scope allows just that program', () => {
    const a = allowedScopeTargets([scope({ level: 'PROGRAM', programId: 'p2' })], ORG);
    expect(allowedLevels(a)).toEqual(['PROGRAM']);
    expect(ids(a.PROGRAM)).toEqual(['p2']);
  });

  it('joins several scopes', () => {
    const a = allowedScopeTargets(
      [
        scope({ level: 'PROGRAM', programId: 'p2' }),
        scope({ level: 'DEPARTMENT', departmentId: 'd1' }),
      ],
      ORG,
    );
    expect(ids(a.PROGRAM)).toEqual(['p1', 'p2']);
  });

  it('leaves out inactive units even when covered', () => {
    const a = allowedScopeTargets([scope({ level: 'PROGRAM', programId: 'p3' })], ORG);
    expect(allowedLevels(a)).toEqual([]);
  });

  it('allows nothing without any scope', () => {
    expect(allowedLevels(allowedScopeTargets([], ORG))).toEqual([]);
  });
});

describe('excludeHeldScopes', () => {
  const own = [scope({ level: 'FACULTY', facultyId: 'f1' })];

  it('drops the units the target already holds, level by level', () => {
    const allowed = allowedScopeTargets(own, ORG);
    const left = excludeHeldScopes(allowed, [
      scope({ level: 'DEPARTMENT', departmentId: 'd1' }),
      scope({ level: 'FACULTY', facultyId: 'f1' }),
    ]);
    expect(left.FACULTY.size).toBe(0);
    expect(left.DEPARTMENT.size).toBe(0);
    expect(ids(left.PROGRAM)).toEqual(['p1']); // a held department does not remove its programs
    expect(allowedLevels(left)).toEqual(['PROGRAM']);
  });

  it('leaves nothing to offer when everything is held', () => {
    const allowed = allowedScopeTargets([scope({ level: 'PROGRAM', programId: 'p1' })], ORG);
    const left = excludeHeldScopes(allowed, [scope({ level: 'PROGRAM', programId: 'p1' })]);
    expect(allowedLevels(left)).toEqual([]);
  });

  it('does not change the set it is given', () => {
    const allowed = allowedScopeTargets(own, ORG);
    excludeHeldScopes(allowed, [scope({ level: 'FACULTY', facultyId: 'f1' })]);
    expect(allowed.FACULTY.size).toBe(1);
  });

  it('ignores a held unit that was not on offer', () => {
    const allowed = allowedScopeTargets(own, ORG);
    const left = excludeHeldScopes(allowed, [scope({ level: 'FACULTY', facultyId: 'f2' })]);
    expect(ids(left.FACULTY)).toEqual(['f1']);
  });
});

describe('allActiveScopeTargets', () => {
  it('lists every active unit and nothing inactive', () => {
    const all = allActiveScopeTargets(ORG);
    expect(ids(all.FACULTY)).toEqual(['f1', 'f2']);
    expect(ids(all.DEPARTMENT)).toEqual(['d1', 'd3']);
    expect(ids(all.PROGRAM)).toEqual(['p1', 'p2']);
  });
});
