import type { AdminScopeCurriculumEntry, AdminScopeProgram } from '@eduanalyze-ai/shared-types';
import type {
  AdminScopeOverviewReport,
  SystemCurriculumOverviewReport,
} from '@eduanalyze-ai/shared-types';
import {
  countByTab,
  directoryFromScopeOverview,
  directoryFromSystemOverview,
  filterCurricula,
  findCurriculum,
  placeOf,
} from './admin-curricula';

function entry(
  id: string,
  dataState: AdminScopeCurriculumEntry['dataState'],
  programCode = 'CPE',
  programName = 'วิศวกรรมคอมพิวเตอร์',
): AdminScopeCurriculumEntry {
  return {
    curriculumId: id,
    version: '2565',
    effectiveYear: 2565,
    programCode,
    programName,
    dataState,
    studentCount: dataState === 'HAS_STUDENTS' ? 10 : 0,
    courseCount: 3,
    ploCount: 2,
  };
}

const ENTRIES = [
  entry('a', 'HAS_STUDENTS'),
  entry('b', 'STRUCTURE_ONLY', 'IT', 'เทคโนโลยีสารสนเทศ'),
  entry('c', 'EMPTY', 'DS', 'วิทยาการข้อมูล'),
  entry('d', 'HAS_STUDENTS', 'IT', 'เทคโนโลยีสารสนเทศ'),
];

describe('countByTab', () => {
  it('counts every tier and the total', () => {
    expect(countByTab(ENTRIES)).toEqual({
      ALL: 4,
      HAS_STUDENTS: 2,
      STRUCTURE_ONLY: 1,
      EMPTY: 1,
    });
  });
});

describe('filterCurricula', () => {
  it('filters by tab', () => {
    expect(filterCurricula(ENTRIES, 'HAS_STUDENTS', '').map((e) => e.curriculumId)).toEqual([
      'a',
      'd',
    ]);
  });
  it('searches name and code, case-insensitively', () => {
    expect(filterCurricula(ENTRIES, 'ALL', 'it').map((e) => e.curriculumId)).toEqual(['b', 'd']);
    expect(filterCurricula(ENTRIES, 'ALL', 'วิทยาการ').map((e) => e.curriculumId)).toEqual(['c']);
  });
  it('combines tab and search', () => {
    expect(filterCurricula(ENTRIES, 'EMPTY', 'it')).toEqual([]);
  });
});

describe('placeOf', () => {
  const programs: AdminScopeProgram[] = [
    {
      programId: 'p1',
      code: 'CPE',
      name: 'x',
      departmentName: 'ภาควิชาคอม',
      facultyName: 'คณะวิศวะ',
    },
  ];
  it('joins on the program code', () => {
    expect(placeOf({ programCode: 'CPE' }, programs)).toEqual({
      departmentName: 'ภาควิชาคอม',
      facultyName: 'คณะวิศวะ',
    });
  });
  it('returns null when the program is not in the list', () => {
    expect(placeOf({ programCode: 'ZZZ' }, programs)).toBeNull();
  });
});

describe('findCurriculum', () => {
  it('finds by id or returns null', () => {
    expect(findCurriculum(ENTRIES, 'c')?.programCode).toBe('DS');
    expect(findCurriculum(ENTRIES, 'nope')).toBeNull();
  });
});

describe('curriculum directory', () => {
  const systemEntry = {
    ...entry('s1', 'HAS_STUDENTS'),
    cloCount: 4,
    averageGpa: 3.1,
    studentsAtRiskCount: 1,
    graduationReadyCount: 2,
    averagePloValue: 70,
    radar: [],
    departmentName: 'ภาควิชา',
    facultyName: 'คณะ',
  };

  it('lists every curriculum of the system report for a Super Admin, once per program place', () => {
    const report = {
      totals: {},
      curricula: [systemEntry, { ...systemEntry, curriculumId: 's2' }],
      problematicPlos: [],
      problematicClos: [],
    } as unknown as SystemCurriculumOverviewReport;
    const directory = directoryFromSystemOverview(report);
    expect(directory.entries.map((e) => e.curriculumId)).toEqual(['s1', 's2']);
    expect(directory.entries[0]).not.toHaveProperty('radar');
    expect(directory.programs).toEqual([
      { code: 'CPE', departmentName: 'ภาควิชา', facultyName: 'คณะ' },
    ]);
    expect(directory.isEmpty).toBe(false);
    expect(findCurriculum(directory.entries, 's2')).not.toBeNull();
  });

  it('is empty only when the system has no curricula', () => {
    const report = { curricula: [] } as unknown as SystemCurriculumOverviewReport;
    expect(directoryFromSystemOverview(report).isEmpty).toBe(true);
  });

  it('keeps the Admin scope list, programs and no-scope flag as they were', () => {
    const program: AdminScopeProgram = {
      programId: 'p',
      code: 'CPE',
      name: 'x',
      departmentName: 'd',
      facultyName: 'f',
    };
    const make = (programCount: number) =>
      ({
        scope: { programCount, programs: [program] },
        curricula: { entries: ENTRIES },
      }) as unknown as AdminScopeOverviewReport;
    expect(directoryFromScopeOverview(make(1))).toEqual({
      entries: ENTRIES,
      programs: [program],
      isEmpty: false,
    });
    expect(directoryFromScopeOverview(make(0)).isEmpty).toBe(true);
  });
});
