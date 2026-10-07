import type {
  AtRiskStudent,
  CloAchievementEntry,
  InstructorCourseSummary,
  SemesterAchievement,
  SemesterTerm,
} from '@eduanalyze-ai/shared-types';
import { NO_STUDENTS_IN_COURSE, buildCourseDetailSummary } from './course-detail-summary';
import { buildCourseSnapshot, summaryLine } from './course-snapshot';
import { emptyCounts } from './instructor-overview';

type Input = Parameters<typeof buildCourseDetailSummary>[0];

// 100 graded people, `pct` of them at B or above, so the share reads as `pct`%.
const grades = (pct: number): Input['gradeDistribution'] => ({ ...emptyCounts(), A: pct, C: 100 - pct });

function course(overrides: Partial<Input> = {}): Input {
  return {
    gradeDistribution: grades(82),
    achievementThreshold: 60,
    atRiskStudents: [],
    clos: [],
    semesterTrend: [],
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

const clo = (id: string, isAchieved: boolean): CloAchievementEntry => ({
  cloId: id,
  code: id,
  description: id,
  threshold: 60,
  isAchieved,
});

const term = (
  academicYear: number,
  semesterTerm: SemesterTerm,
  studentCount: number,
  achievementPercent: number,
): SemesterAchievement => ({ academicYear, semesterTerm, studentCount, achievementPercent });

describe('buildCourseDetailSummary', () => {
  it('normal: passes the bar, nobody to follow up, every CLO met', () => {
    expect(
      buildCourseDetailSummary(course({ clos: [clo('a', true), clo('b', true), clo('c', true)] })),
    ).toBe('ได้ B ขึ้นไป 82% ผ่านเป้า 60% · ยังไม่มีนักศึกษาที่ต้องติดตาม · เป้าการเรียนรู้ผ่านครบ 3 ข้อ');
  });

  it('at risk: below the bar, follow-ups, missed CLOs and the latest-term arrow', () => {
    const risky = course({
      gradeDistribution: grades(48),
      atRiskStudents: [atRisk('s1', 'CRITICAL'), atRisk('s2', 'WATCH'), atRisk('s3', 'WATCH')],
      clos: [clo('a', true), clo('b', false), clo('c', false)],
      semesterTrend: [term(2566, 'SECOND', 20, 60), term(2567, 'FIRST', 20, 55)],
    });
    expect(buildCourseDetailSummary(risky)).toBe(
      'ได้ B ขึ้นไป 48% ยังไม่ถึงเป้า 60% · ต้องติดตาม 3 คน (เร่งด่วน 1) · เป้าการเรียนรู้ยังไม่ผ่าน 2 จาก 3 · เทอมล่าสุด 20 คน: ▼ แย่ลง 5 จุดจากเทอมก่อน',
    );
  });

  it('only WATCH students: no urgent part', () => {
    expect(buildCourseDetailSummary(course({ atRiskStudents: [atRisk('s1', 'WATCH')] }))).toBe(
      'ได้ B ขึ้นไป 82% ผ่านเป้า 60% · ต้องติดตาม 1 คน',
    );
  });

  it('exactly on the bar counts as passing', () => {
    expect(buildCourseDetailSummary(course({ gradeDistribution: grades(60) }))).toContain('ผ่านเป้า 60%');
  });

  it('no data: no students gives the empty line', () => {
    expect(buildCourseDetailSummary(course({ gradeDistribution: emptyCounts() }))).toBe(
      NO_STUDENTS_IN_COURSE,
    );
  });

  it('leaves out the arrow with one term and the CLO part with no CLOs', () => {
    expect(buildCourseDetailSummary(course({ semesterTrend: [term(2567, 'FIRST', 20, 80)] }))).toBe(
      'ได้ B ขึ้นไป 82% ผ่านเป้า 60% · ยังไม่มีนักศึกษาที่ต้องติดตาม',
    );
  });

  it('keeps the percent but drops the verdict when the bar is not a number', () => {
    expect(buildCourseDetailSummary(course({ achievementThreshold: Number.NaN }))).toBe(
      'ได้ B ขึ้นไป 82% · ยังไม่มีนักศึกษาที่ต้องติดตาม',
    );
  });

  it('never prints NaN or undefined when numbers are broken', () => {
    const line = buildCourseDetailSummary(
      course({
        gradeDistribution: { ...emptyCounts(), W: 3 },
        achievementThreshold: Number.NaN,
        semesterTrend: [term(2566, 'SECOND', 10, Number.NaN), term(2567, 'FIRST', 10, Number.NaN)],
      }),
    );
    expect(line).toBe('ข้อมูลยังน้อย — สรุปได้เบื้องต้น · ยังไม่มีนักศึกษาที่ต้องติดตาม');
    expect(line).not.toMatch(/NaN|undefined|Infinity/);
  });

  it('accepts a full InstructorCourseSummary', () => {
    const full = {
      ...course(),
      courseId: 'c1',
      studentCount: 0,
      achievementPercent: 0,
      code: 'CS101',
      name: 'x',
      plos: [],
      courseAssessment: { courseId: 'c1', submissionCount: 0, clos: [] },
    } satisfies InstructorCourseSummary;
    expect(buildCourseDetailSummary(full)).toContain('ได้ B ขึ้นไป 82%');
  });

  it('under 5 graded people: no verdict, no CLO verdict, says the data is thin', () => {
    const few = course({
      gradeDistribution: { ...emptyCounts(), A: 4 },
      clos: [clo('a', true), clo('b', false)],
    });
    const line = buildCourseDetailSummary(few);
    expect(line).toBe('ข้อมูลยังน้อย — สรุปได้เบื้องต้น · ยังไม่มีนักศึกษาที่ต้องติดตาม');
    expect(line).not.toMatch(/ผ่านเป้า|ไม่ผ่าน|ยังไม่ถึงเป้า|ใกล้เป้า|เป้าการเรียนรู้/);
  });

  it('W and I do not count towards the 5 people', () => {
    const line = buildCourseDetailSummary(course({ gradeDistribution: { ...emptyCounts(), A: 4, W: 3, I: 2 } }));
    expect(line).toContain('ข้อมูลยังน้อย');
  });

  it('5 graded people is enough for a verdict', () => {
    expect(buildCourseDetailSummary(course({ gradeDistribution: { ...emptyCounts(), A: 5 } }))).toContain(
      'ได้ B ขึ้นไป 100% ผ่านเป้า 60%',
    );
  });

  it('says near the bar within 5 points, like the overview does', () => {
    expect(buildCourseDetailSummary(course({ gradeDistribution: grades(57) }))).toContain('ใกล้เป้า 60%');
  });

  it('agrees with the overview on the share', () => {
    const full = {
      ...course({ gradeDistribution: { ...emptyCounts(), A: 7, B: 2, C: 3, F: 1, W: 1 } }),
      courseId: 'c1',
      studentCount: 0,
      achievementPercent: 0,
      code: 'CS101',
      name: 'x',
      plos: [],
      courseAssessment: { courseId: 'c1', submissionCount: 0, clos: [] },
    } satisfies InstructorCourseSummary;
    const snapshot = buildCourseSnapshot({ course: full, seatRows: [], yearLevelByStudent: null });
    const pct = Math.round(snapshot.stats.achievedPercent ?? -1);
    expect(summaryLine(snapshot)).toContain(`${pct}%`);
    expect(buildCourseDetailSummary(full)).toContain(`ได้ B ขึ้นไป ${pct}%`);
  });
});
