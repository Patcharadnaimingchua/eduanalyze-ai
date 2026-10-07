import type { InstructorStudentEntry, RiskLevel } from '@eduanalyze-ai/shared-types';
import {
  ALL,
  DEFAULT_STUDENT_FILTERS,
  NO_STUDENTS_IN_COURSES,
  applyStudentFilters,
  buildStudentsSummary,
  buildYearLevelsFigures,
  countByRisk,
  groupByPerson,
  parseStudentFilters,
  studentFiltersToQuery,
  worstRiskById,
} from './student-directory';

const GRADE: Record<RiskLevel, InstructorStudentEntry['grade']> = {
  CRITICAL: 'F',
  WATCH: 'C',
  NORMAL: 'A',
};

function row(
  id: string,
  course: string,
  riskLevel: RiskLevel,
  name = `นักศึกษา ${id}`,
): InstructorStudentEntry {
  return {
    studentProfileId: id,
    studentCode: `S${id}`,
    fullName: name,
    courseId: `c-${course}`,
    courseCode: course,
    courseName: `วิชา ${course}`,
    grade: GRADE[riskLevel],
    riskLevel,
  };
}

// s1 is at risk in two courses (WATCH + CRITICAL); s2 WATCH; s3, s4 NORMAL.
const entries = [
  row('1', 'CS101', 'WATCH', 'Somchai'),
  row('1', 'CS201', 'CRITICAL', 'Somchai'),
  row('2', 'CS101', 'WATCH', 'Malee'),
  row('3', 'CS101', 'NORMAL', 'Anan'),
  row('3', 'CS301', 'NORMAL', 'Anan'),
  row('4', 'CS201', 'NORMAL', 'Dara'),
];

const params = (query: string) => new URLSearchParams(query);

describe('groupByPerson', () => {
  it('makes one entry per student with the worst course first', () => {
    const people = groupByPerson(entries);
    expect(people).toHaveLength(4);
    const s1 = people.find((p) => p.studentProfileId === '1')!;
    expect(s1.worstRisk).toBe('CRITICAL');
    expect(s1.primary.courseCode).toBe('CS201');
    expect(s1.others.map((o) => o.courseCode)).toEqual(['CS101']);
  });

  it('breaks a tie on risk by course code', () => {
    const anan = groupByPerson(entries).find((p) => p.studentProfileId === '3')!;
    expect(anan.primary.courseCode).toBe('CS101');
    expect(anan.others.map((o) => o.courseCode)).toEqual(['CS301']);
  });
});

describe('countByRisk', () => {
  it('counts people at their worst level, never rows', () => {
    expect(countByRisk(groupByPerson(entries))).toEqual({
      CRITICAL: 1,
      WATCH: 1,
      NORMAL: 2,
      total: 4,
    });
  });
});

describe('applyStudentFilters', () => {
  it('with no filters lists everyone, worst risk first then code', () => {
    const { people, counts } = applyStudentFilters(entries, DEFAULT_STUDENT_FILTERS);
    expect(people.map((p) => p.studentProfileId)).toEqual(['1', '2', '3', '4']);
    expect(counts.total).toBe(4);
  });

  it('filters by worst level but keeps the counts of every level', () => {
    const { people, counts } = applyStudentFilters(entries, {
      ...DEFAULT_STUDENT_FILTERS,
      risk: 'WATCH',
    });
    expect(people.map((p) => p.studentProfileId)).toEqual(['2']);
    expect(counts).toEqual({ CRITICAL: 1, WATCH: 1, NORMAL: 2, total: 4 });
  });

  it('a course filter re-ranks a person by that course only', () => {
    const { people, counts } = applyStudentFilters(entries, {
      ...DEFAULT_STUDENT_FILTERS,
      courseId: 'c-CS101',
    });
    const s1 = people.find((p) => p.studentProfileId === '1')!;
    expect(s1.worstRisk).toBe('WATCH');
    expect(s1.others).toEqual([]);
    expect(counts).toEqual({ CRITICAL: 0, WATCH: 2, NORMAL: 1, total: 3 });
  });

  it('a course the instructor does not teach matches nobody', () => {
    const { people, counts } = applyStudentFilters(entries, {
      ...DEFAULT_STUDENT_FILTERS,
      courseId: 'c-OTHER',
    });
    expect(people).toEqual([]);
    expect(counts.total).toBe(0);
  });

  it('searches code and name, case-insensitive and trimmed', () => {
    const byName = applyStudentFilters(entries, { ...DEFAULT_STUDENT_FILTERS, q: '  malee ' });
    expect(byName.people.map((p) => p.studentProfileId)).toEqual(['2']);
    const byCode = applyStudentFilters(entries, { ...DEFAULT_STUDENT_FILTERS, q: 's4' });
    expect(byCode.people.map((p) => p.studentProfileId)).toEqual(['4']);
    expect(byCode.counts).toEqual({ CRITICAL: 0, WATCH: 0, NORMAL: 1, total: 1 });
  });

  it('is empty for no rows', () => {
    expect(applyStudentFilters([], DEFAULT_STUDENT_FILTERS)).toEqual({
      people: [],
      counts: { CRITICAL: 0, WATCH: 0, NORMAL: 0, total: 0 },
    });
  });
});

describe('parseStudentFilters / studentFiltersToQuery', () => {
  it('reads the dashboard deep link and the other filters', () => {
    expect(parseStudentFilters(params('risk=CRITICAL'))).toEqual({
      risk: 'CRITICAL',
      courseId: ALL,
      q: '',
    });
    expect(parseStudentFilters(params('risk=WATCH&course=c-CS101&q=S1'))).toEqual({
      risk: 'WATCH',
      courseId: 'c-CS101',
      q: 'S1',
    });
  });

  it('falls back to defaults for unknown or empty values', () => {
    expect(parseStudentFilters(params('risk=FOO&course='))).toEqual(DEFAULT_STUDENT_FILTERS);
    expect(parseStudentFilters(params(''))).toEqual(DEFAULT_STUDENT_FILTERS);
  });

  it('round-trips and leaves defaults out of the URL', () => {
    const filters = { risk: 'NORMAL' as const, courseId: 'c-CS101', q: 'ma lee' };
    expect(parseStudentFilters(params(studentFiltersToQuery(filters)))).toEqual(filters);
    expect(studentFiltersToQuery(DEFAULT_STUDENT_FILTERS)).toBe('');
    expect(studentFiltersToQuery({ ...DEFAULT_STUDENT_FILTERS, q: '   ' })).toBe('');
  });
});

describe('buildStudentsSummary', () => {
  it('at risk: people to follow up first, counted once each', () => {
    expect(buildStudentsSummary(entries, 3)).toBe(
      'ต้องติดตาม 2 คน (เร่งด่วน 1) จากนักศึกษา 4 คนใน 3 วิชา',
    );
  });

  it('normal: nobody at risk', () => {
    const calm = [row('3', 'CS101', 'NORMAL'), row('4', 'CS201', 'NORMAL')];
    expect(buildStudentsSummary(calm, 2)).toBe(
      'นักศึกษา 2 คนใน 2 วิชา · ยังไม่มีนักศึกษาที่ต้องติดตาม',
    );
  });

  it('only WATCH: no urgent part', () => {
    expect(buildStudentsSummary([row('2', 'CS101', 'WATCH')], 1)).toBe(
      'ต้องติดตาม 1 คน จากนักศึกษา 1 คนใน 1 วิชา',
    );
  });

  it('no data: courses but no students, or nothing at all', () => {
    expect(buildStudentsSummary([], 3)).toBe(NO_STUDENTS_IN_COURSES);
    expect(buildStudentsSummary([], 0)).toBeNull();
  });

  it('never prints NaN or undefined', () => {
    const odd = [{ ...row('9', 'CS101', 'NORMAL'), riskLevel: 'UNKNOWN' as RiskLevel }];
    const line = buildStudentsSummary(odd, Number.NaN);
    expect(line).not.toMatch(/NaN|undefined|Infinity/);
  });
});

type Track = 'on_track' | 'behind' | null;
const person = (id: string, onTrackStatus: Track = 'on_track') => ({
  studentProfileId: id,
  onTrackStatus,
});
const bucket = (yearLevel: number, ...students: ReturnType<typeof person>[]) => ({
  yearLevel,
  label: yearLevel === 4 ? 'ปี 4 ขึ้นไป' : `ปี ${yearLevel}`,
  students,
});

describe('worstRiskById', () => {
  it('keeps the worst level per student across courses', () => {
    const map = worstRiskById(entries);
    expect(map.get('1')).toBe('CRITICAL');
    expect(map.get('2')).toBe('WATCH');
    expect(map.get('3')).toBe('NORMAL');
    expect(map.has('99')).toBe(false);
  });
});

describe('buildYearLevelsFigures', () => {
  const risk = new Map<string, RiskLevel>([
    ['a', 'CRITICAL'],
    ['b', 'WATCH'],
    ['c', 'NORMAL'],
    ['d', 'WATCH'],
  ]);

  it('counts everyone, the follow-ups (urgent or watch) and those behind the plan', () => {
    const buckets = [
      bucket(1, person('a')),
      bucket(2, person('b', 'behind'), person('c'), person('d')),
    ];
    expect(buildYearLevelsFigures(buckets, risk)).toEqual({ total: 4, followUps: 3, behind: 1 });
  });

  it('follow-ups are unknown (null), not zero, when the students report is unavailable', () => {
    expect(buildYearLevelsFigures([bucket(1, person('a', 'behind'))], null)).toEqual({
      total: 1,
      followUps: null,
      behind: 1,
    });
  });

  it('a student with no risk row is not counted as a follow-up', () => {
    expect(buildYearLevelsFigures([bucket(1, person('zzz'))], risk).followUps).toBe(0);
  });

  it('no students: all zero', () => {
    expect(buildYearLevelsFigures([bucket(1), bucket(2)], risk)).toEqual({
      total: 0,
      followUps: 0,
      behind: 0,
    });
  });
});
