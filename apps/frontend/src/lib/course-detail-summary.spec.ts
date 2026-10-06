import type {
  AtRiskStudent,
  CloAchievementEntry,
  InstructorCourseSummary,
  SemesterAchievement,
  SemesterTerm,
} from '@eduanalyze-ai/shared-types';
import { NO_STUDENTS_IN_COURSE, buildCourseDetailSummary } from './course-detail-summary';

type Input = Parameters<typeof buildCourseDetailSummary>[0];

function course(overrides: Partial<Input> = {}): Input {
  return {
    studentCount: 40,
    achievementPercent: 82,
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
    ).toBe('ผลสัมฤทธิ์ 82% ผ่านเกณฑ์ 60% · ยังไม่มีนักศึกษาที่ต้องติดตาม · CLO ผ่านครบ 3 ข้อ');
  });

  it('at risk: below the bar, follow-ups, missed CLOs and the latest-term arrow', () => {
    const risky = course({
      achievementPercent: 48,
      atRiskStudents: [atRisk('s1', 'CRITICAL'), atRisk('s2', 'WATCH'), atRisk('s3', 'WATCH')],
      clos: [clo('a', true), clo('b', false), clo('c', false)],
      semesterTrend: [term(2566, 'SECOND', 20, 60), term(2567, 'FIRST', 20, 55)],
    });
    expect(buildCourseDetailSummary(risky)).toBe(
      'ผลสัมฤทธิ์ 48% ต่ำกว่าเกณฑ์ 60% · ต้องติดตาม 3 คน (เร่งด่วน 1) · CLO ยังไม่ผ่าน 2 จาก 3 · เทอมล่าสุด 20 คน: ▼ 5 จุดจากเทอมก่อน',
    );
  });

  it('only WATCH students: no urgent part', () => {
    expect(buildCourseDetailSummary(course({ atRiskStudents: [atRisk('s1', 'WATCH')] }))).toBe(
      'ผลสัมฤทธิ์ 82% ผ่านเกณฑ์ 60% · ต้องติดตาม 1 คน',
    );
  });

  it('exactly on the bar counts as passing', () => {
    expect(buildCourseDetailSummary(course({ achievementPercent: 60 }))).toContain('ผ่านเกณฑ์ 60%');
  });

  it('no data: no students gives the empty line', () => {
    expect(buildCourseDetailSummary(course({ studentCount: 0, achievementPercent: 0 }))).toBe(
      NO_STUDENTS_IN_COURSE,
    );
    expect(buildCourseDetailSummary(course({ studentCount: Number.NaN }))).toBe(NO_STUDENTS_IN_COURSE);
  });

  it('leaves out the arrow with one term and the CLO part with no CLOs', () => {
    expect(buildCourseDetailSummary(course({ semesterTrend: [term(2567, 'FIRST', 20, 80)] }))).toBe(
      'ผลสัมฤทธิ์ 82% ผ่านเกณฑ์ 60% · ยังไม่มีนักศึกษาที่ต้องติดตาม',
    );
  });

  it('keeps the percent but drops the verdict when the bar is not a number', () => {
    expect(buildCourseDetailSummary(course({ achievementThreshold: Number.NaN }))).toBe(
      'ผลสัมฤทธิ์ 82% · ยังไม่มีนักศึกษาที่ต้องติดตาม',
    );
  });

  it('never prints NaN or undefined when numbers are broken', () => {
    const line = buildCourseDetailSummary(
      course({
        achievementPercent: Number.NaN,
        achievementThreshold: Number.NaN,
        semesterTrend: [term(2566, 'SECOND', 10, Number.NaN), term(2567, 'FIRST', 10, Number.NaN)],
      }),
    );
    expect(line).toBe('ยังไม่มีนักศึกษาที่ต้องติดตาม');
    expect(line).not.toMatch(/NaN|undefined|Infinity/);
  });

  it('accepts a full InstructorCourseSummary', () => {
    const full = {
      ...course(),
      courseId: 'c1',
      code: 'CS101',
      name: 'x',
      gradeDistribution: {} as InstructorCourseSummary['gradeDistribution'],
      plos: [],
      courseAssessment: { courseId: 'c1', submissionCount: 0, clos: [] },
    } satisfies InstructorCourseSummary;
    expect(buildCourseDetailSummary(full)).toContain('ผลสัมฤทธิ์ 82%');
  });
});
