import { buildOrgCounts, describeCounts } from './org-tree-counts';

const faculties = [{ id: 'f1' }, { id: 'f2' }];
const departments = [
  { id: 'd1', facultyId: 'f1' },
  { id: 'd2', facultyId: 'f1' },
  { id: 'd3', facultyId: 'f2' },
];
const programs = [
  { id: 'p1', departmentId: 'd1' },
  { id: 'p2', departmentId: 'd1' },
  { id: 'p3', departmentId: 'd3' },
];
const curricula = [{ programId: 'p1' }, { programId: 'p1' }, { programId: 'p3' }];

describe('buildOrgCounts', () => {
  const counts = buildOrgCounts(faculties, departments, programs, curricula);

  it('rolls every level up to its faculty', () => {
    expect(counts.faculty.get('f1')).toEqual({ departments: 2, programs: 2, curricula: 2 });
    expect(counts.faculty.get('f2')).toEqual({ departments: 1, programs: 1, curricula: 1 });
  });

  it('counts a department and a program by what sits directly under them', () => {
    expect(counts.department.get('d1')).toMatchObject({ programs: 2, curricula: 2 });
    expect(counts.department.get('d2')).toMatchObject({ programs: 0, curricula: 0 });
    expect(counts.program.get('p1')?.curricula).toBe(2);
    expect(counts.program.get('p2')?.curricula).toBe(0);
  });

  it('ignores a curriculum whose program is not listed', () => {
    const c = buildOrgCounts(faculties, departments, programs, [{ programId: 'gone' }]);
    expect(c.faculty.get('f1')?.curricula).toBe(0);
  });

  it('handles an empty system', () => {
    const c = buildOrgCounts([], [], [], []);
    expect(c.faculty.size + c.department.size + c.program.size).toBe(0);
  });
});

describe('describeCounts', () => {
  it('names only the requested levels, in order', () => {
    const c = { departments: 8, programs: 24, curricula: 18 };
    expect(describeCounts(c, ['departments', 'programs', 'curricula'])).toBe(
      '8 ภาควิชา · 24 สาขา · 18 หลักสูตร',
    );
    expect(describeCounts(c, ['curricula'])).toBe('18 หลักสูตร');
  });
});
