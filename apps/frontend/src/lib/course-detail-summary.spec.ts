import type { AtRiskStudent, InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { NO_STUDENTS_IN_COURSE, buildCourseDetailSummary } from './course-detail-summary';
import { buildCourseSnapshot } from './course-snapshot';
import { centerLine, summarizeGradeCenter } from './grade-center';
import { emptyCounts } from './instructor-overview';

type Input = Parameters<typeof buildCourseDetailSummary>[0];

const counts = (d: Partial<Input['gradeDistribution']>): Input['gradeDistribution'] => ({
  ...emptyCounts(),
  ...d,
});

function course(overrides: Partial<Input> = {}): Input {
  return {
    gradeDistribution: counts({ A: 2, B_PLUS: 4, B: 3, C: 1 }),
    atRiskStudents: [],
    ...overrides,
  };
}

const atRisk = (id: string, riskLevel: 'CRITICAL' | 'WATCH'): AtRiskStudent => ({
  studentProfileId: id,
  studentCode: id,
  fullName: id,
  grade: riskLevel === 'CRITICAL' ? 'F' : 'C',
  riskLevel,
  academicYear: 2567,
  semesterTerm: 'FIRST',
});

describe('buildCourseDetailSummary', () => {
  it('normal: most common grade, middle grade, course GPA, nobody to follow up', () => {
    expect(buildCourseDetailSummary(course())).toBe(
      'เกรดที่พบมากที่สุด B+ · เกรดกลาง B+ · GPA วิชา 3.30 · ยังไม่มีนักศึกษาที่ต้องติดตาม',
    );
  });

  it('follow-ups: people to follow up and how many are urgent', () => {
    const risky = course({
      atRiskStudents: [atRisk('s1', 'CRITICAL'), atRisk('s2', 'WATCH'), atRisk('s3', 'WATCH')],
    });
    expect(buildCourseDetailSummary(risky)).toContain('· ต้องติดตาม 3 คน (เร่งด่วน 1)');
  });

  it('only WATCH students: no urgent part', () => {
    expect(buildCourseDetailSummary(course({ atRiskStudents: [atRisk('s1', 'WATCH')] }))).toMatch(
      /· ต้องติดตาม 1 คน$/,
    );
  });

  it('lists every most common grade when they tie, and a range for an even middle', () => {
    const line = buildCourseDetailSummary(
      course({ gradeDistribution: counts({ A: 3, B_PLUS: 3, B: 1, C: 1 }) }),
    );
    expect(line).toContain('เกรดที่พบมากที่สุด A และ B+');
    expect(line).toContain('เกรดกลาง B+ ');
    const even = buildCourseDetailSummary(
      course({ gradeDistribution: counts({ B: 3, B_PLUS: 3 }) }),
    );
    expect(even).toContain('เกรดกลาง B ถึง B+');
  });

  it('no data: no students gives the empty line', () => {
    expect(buildCourseDetailSummary(course({ gradeDistribution: emptyCounts() }))).toBe(
      NO_STUDENTS_IN_COURSE,
    );
  });

  it('under 5 graded people: no centre, no GPA, says the data is thin', () => {
    const line = buildCourseDetailSummary(course({ gradeDistribution: counts({ A: 4 }) }));
    expect(line).toBe('ข้อมูลยังน้อย — สรุปได้เบื้องต้น · ยังไม่มีนักศึกษาที่ต้องติดตาม');
    expect(line).not.toMatch(/เกรดกลาง|GPA|เกรดที่พบมากที่สุด/);
  });

  it('W, I, S and U do not count towards the 5 people', () => {
    const line = buildCourseDetailSummary(
      course({ gradeDistribution: counts({ A: 4, W: 3, I: 2, S: 1, U: 1 }) }),
    );
    expect(line).toContain('ข้อมูลยังน้อย');
  });

  it('5 to 9 people: shown with the small-sample note', () => {
    const line = buildCourseDetailSummary(course({ gradeDistribution: counts({ A: 5 }) }));
    expect(line).toContain('เกรดที่พบมากที่สุด A · เกรดกลาง A · GPA วิชา 4.00 (ตัวอย่างน้อย)');
  });

  it('10 people or more: no small-sample note', () => {
    const line = buildCourseDetailSummary(course({ gradeDistribution: counts({ B: 10 }) }));
    expect(line).not.toContain('ตัวอย่างน้อย');
  });

  it('has no goal wording at all', () => {
    for (const d of [{ A: 12 }, { F: 12 }, { A: 5, F: 5 }, { A: 4 }, { C: 7 }]) {
      const line = buildCourseDetailSummary(course({ gradeDistribution: counts(d) }));
      expect(line).not.toMatch(/ผ่านเป้า|ใกล้เป้า|ต่ำกว่าเป้า|ยังไม่ถึงเป้า|เกินเป้า|เป้า/);
    }
  });

  it('never prints NaN or undefined when numbers are broken', () => {
    const line = buildCourseDetailSummary(
      course({ gradeDistribution: { ...emptyCounts(), W: 3, A: Number.NaN } }),
    );
    expect(line).not.toMatch(/NaN|undefined|Infinity/);
  });

  it('accepts a full InstructorCourseSummary', () => {
    const full = {
      ...course(),
      courseId: 'c1',
      studentCount: 0,
      achievementPercent: 0,
      achievementThreshold: 70,
      code: 'CS101',
      name: 'x',
      clos: [],
      semesterTrend: [],
      plos: [],
      courseAssessment: { courseId: 'c1', submissionCount: 0, clos: [] },
    } satisfies InstructorCourseSummary;
    expect(buildCourseDetailSummary(full)).toContain('GPA วิชา 3.30');
  });

  it('agrees with the overview on the course GPA', () => {
    const full = {
      ...course({ gradeDistribution: counts({ A: 7, B: 2, C: 3, F: 1, W: 1 }) }),
      courseId: 'c1',
      studentCount: 0,
      achievementPercent: 0,
      achievementThreshold: 70,
      code: 'CS101',
      name: 'x',
      clos: [],
      semesterTrend: [],
      plos: [],
      courseAssessment: { courseId: 'c1', submissionCount: 0, clos: [] },
    } satisfies InstructorCourseSummary;
    const snapshot = buildCourseSnapshot({ course: full, seatRows: [], yearLevelByStudent: null });
    const line = centerLine(summarizeGradeCenter(snapshot.stats.counts));
    expect(line).not.toBeNull();
    expect(buildCourseDetailSummary(full)).toContain(line as string);
    // the GPA the grade-point mean of the same snapshot reads the same
    expect(line).toContain(`GPA วิชา ${snapshot.stats.gpa?.toFixed(2)}`);
  });
});
