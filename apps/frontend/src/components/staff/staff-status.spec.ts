import type { StaffStudentRiskEntry } from '@eduanalyze-ai/shared-types';
import {
  coursesWithoutInstructor,
  readGroupGpa,
  sharePercent,
  sortRows,
  staffStatus,
  summarizeByYearLevel,
  summarizeStudents,
  toRows,
} from './staff-status';

let n = 0;
function student(overrides: Partial<StaffStudentRiskEntry> = {}): StaffStudentRiskEntry {
  n += 1;
  return {
    studentProfileId: `s${n}`,
    studentCode: `65${String(n).padStart(3, '0')}`,
    fullName: `Student ${n}`,
    programId: 'P1',
    curriculumId: 'C1',
    admissionYear: 2565,
    isActive: true,
    riskLevel: 'NORMAL',
    gpa: 3,
    atRiskCourseCount: 0,
    ...overrides,
  };
}

// The five kinds of active student the backend can return, including the two
// awkward ones: only a U (a reading but no GPA) and only an S (a grade that
// reads as nothing).
const onlyU = () => student({ riskLevel: 'CRITICAL', gpa: null, atRiskCourseCount: 1 });
const onlyS = () => student({ riskLevel: 'NORMAL', gpa: null, atRiskCourseCount: 0 });

describe('staffStatus', () => {
  it('puts suspended students in their own status whatever their grades', () => {
    expect(staffStatus(student({ isActive: false, riskLevel: 'CRITICAL' }))).toBe('SUSPENDED');
  });

  it.each([
    ['CRITICAL', student({ riskLevel: 'CRITICAL', gpa: 1.2, atRiskCourseCount: 2 })],
    ['WATCH', student({ riskLevel: 'WATCH', gpa: 2.1, atRiskCourseCount: 1 })],
    ['NORMAL', student()],
    ['NO_DATA', student({ gpa: null })],
  ])('reads %s', (key, s) => expect(staffStatus(s)).toBe(key));

  it('keeps a student whose only grade is U as CRITICAL, not no data', () => {
    expect(staffStatus(onlyU())).toBe('CRITICAL');
  });

  it('reads a student whose only grade is S as no data', () => {
    expect(staffStatus(onlyS())).toBe('NO_DATA');
  });
});

describe('summarizeStudents', () => {
  const mixed = () => [
    student({ riskLevel: 'CRITICAL', gpa: 1.2, atRiskCourseCount: 2 }),
    student({ riskLevel: 'WATCH', gpa: 2.1, atRiskCourseCount: 1 }),
    student({ gpa: 3.5 }),
    student({ gpa: 2.5 }),
    onlyU(),
    onlyS(),
    student({ gpa: null }),
    student({ isActive: false, gpa: 2 }),
    student({ isActive: false, gpa: null }),
  ];

  it('makes the four statuses add up to the active students, always', () => {
    const summary = summarizeStudents(mixed());
    const { CRITICAL, WATCH, NORMAL, NO_DATA } = summary.byStatus;
    expect(CRITICAL + WATCH + NORMAL + NO_DATA).toBe(summary.active);
    expect(summary.active).toBe(7);
    expect(summary.suspended).toBe(2);
    expect(summary.byStatus).toEqual({ CRITICAL: 2, WATCH: 1, NORMAL: 2, NO_DATA: 2 });
  });

  it('keeps the sum equal to active for a list of only U and only S students', () => {
    const summary = summarizeStudents([onlyU(), onlyU(), onlyS()]);
    const { CRITICAL, WATCH, NORMAL, NO_DATA } = summary.byStatus;
    expect(CRITICAL + WATCH + NORMAL + NO_DATA).toBe(3);
    expect(summary.active).toBe(3);
  });

  it('counts people with a reading and people with a GPA separately', () => {
    const summary = summarizeStudents(mixed());
    // withRecords excludes only NO_DATA (2); withGpa also drops the only-U student.
    expect(summary.withRecords).toBe(5);
    expect(summary.withGpa).toBe(4);
    expect(summary.withRecords).not.toBe(summary.withGpa);
  });

  it('averages the GPA over the active students that have one, ignoring suspended', () => {
    expect(summarizeStudents(mixed()).averageGpa).toBeCloseTo((1.2 + 2.1 + 3.5 + 2.5) / 4);
  });

  it('has no average when nobody has a GPA', () => {
    expect(summarizeStudents([onlyU(), onlyS()]).averageGpa).toBeNull();
  });
});

describe('readGroupGpa', () => {
  it('says nothing when nobody has a GPA', () => {
    expect(readGroupGpa(null, 0)).toEqual({ kind: 'none', value: null, note: 'ยังไม่มีข้อมูล' });
  });

  it('gives no number under 5 people', () => {
    expect(readGroupGpa(3.1, 4)).toEqual({ kind: 'few', value: null, note: 'ข้อมูลยังน้อย (มี GPA 4 คน)' });
  });

  it('gives the number and its base from 5 people', () => {
    expect(readGroupGpa(2.836, 134)).toEqual({ kind: 'ok', value: '2.84', note: 'เฉลี่ยจาก 134 คนที่มี GPA' });
  });
});

describe('sortRows', () => {
  const rows = toRows(
    [
      student({ studentCode: '65003', gpa: 3.4 }),
      student({ studentCode: '65001', riskLevel: 'WATCH', gpa: 2.2, atRiskCourseCount: 1 }),
      student({ studentCode: '65002', riskLevel: 'CRITICAL', gpa: 1.5, atRiskCourseCount: 2 }),
      student({ studentCode: '65004', gpa: null }),
      student({ studentCode: '65000', isActive: false }),
    ],
    new Map(),
  );
  const codes = (key: Parameters<typeof sortRows>[1]) => sortRows(rows, key).map((r) => r.studentCode);

  it('orders by severity then code by default', () => {
    expect(codes('severity')).toEqual(['65002', '65001', '65003', '65004', '65000']);
  });

  it('orders by code', () => {
    expect(codes('code')).toEqual(['65000', '65001', '65002', '65003', '65004']);
  });

  it('orders by GPA ascending with missing last', () => {
    expect(codes('gpa')).toEqual(['65002', '65001', '65000', '65003', '65004']);
  });

  it('orders by year level with missing last, then by code', () => {
    const withYears = toRows(
      [student({ studentCode: '2' }), student({ studentCode: '1' }), student({ studentCode: '3', isActive: false })],
      new Map([
        ['s' + (n - 2), 2],
        ['s' + (n - 1), 1],
      ]),
    );
    expect(sortRows(withYears, 'year').map((r) => r.studentCode)).toEqual(['1', '2', '3']);
  });
});

describe('summarizeByYearLevel', () => {
  it('builds each year from the same students and counts the behind-plan ones', () => {
    const list = [student(), student(), student(), student({ isActive: false })];
    const rows = toRows(list, new Map([[list[0].studentProfileId, 1], [list[1].studentProfileId, 1], [list[2].studentProfileId, 2]]));
    const years = summarizeByYearLevel(rows, new Set([list[1].studentProfileId]), [1, 2, 3, 4]);
    expect(years.map((y) => y.summary.active)).toEqual([2, 1, 0, 0]);
    expect(years[0].behind).toBe(1);
    // Every active student lands in exactly one year, so the table total matches the cards.
    expect(years.reduce((sum, y) => sum + y.summary.active, 0)).toBe(summarizeStudents(list).active);
  });
});

describe('coursesWithoutInstructor', () => {
  const courses = [
    { id: 'a', curriculumId: 'C1' },
    { id: 'b', curriculumId: 'C1' },
    { id: 'c', curriculumId: 'C2' },
    { id: 'd', curriculumId: 'OTHER' },
  ];

  it('lists courses of the given curricula that no assignment names', () => {
    const result = coursesWithoutInstructor(courses, [{ courseId: 'a' }, { courseId: 'a' }], new Set(['C1', 'C2']));
    expect(result.map((c) => c.id)).toEqual(['b', 'c']);
  });

  it('leaves out curricula that are not in scope', () => {
    expect(coursesWithoutInstructor(courses, [], new Set(['C2'])).map((c) => c.id)).toEqual(['c']);
  });
});

describe('sharePercent', () => {
  it('gives one decimal and never NaN', () => {
    expect(sharePercent(112, 148)).toBe('75.7%');
    expect(sharePercent(0, 0)).toBe('0.0%');
  });
});
