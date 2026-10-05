import type {
  InstructorCourseSummary,
  RiskLevel,
  SemesterTerm,
} from '@eduanalyze-ai/shared-types';
import { NO_STUDENTS_SUMMARY } from './interpret-instructor-courses';

// Pure, rule-based reading of the instructor dashboard response. Like
// interpret-instructor-courses.ts it only reads what GET /dashboard/instructor
// returned, so it stays inside the "courses I teach" scope by construction.

export interface FollowUpCount {
  total: number;
  critical: number;
  watch: number;
}

// People, not rows: a student at risk in two of the instructor's courses is one
// person to follow up, counted at their worst level. The level itself comes
// from the backend's riskLevel() (latest attempt per course); nothing here
// re-derives it from grades.
export function countFollowUps(
  courses: readonly Pick<InstructorCourseSummary, 'atRiskStudents'>[],
): FollowUpCount {
  const worst = new Map<string, Exclude<RiskLevel, 'NORMAL'>>();
  for (const course of courses) {
    for (const student of course.atRiskStudents) {
      if (student.riskLevel === 'NORMAL') continue;
      if (worst.get(student.studentProfileId) !== 'CRITICAL') {
        worst.set(student.studentProfileId, student.riskLevel);
      }
    }
  }
  let critical = 0;
  for (const level of worst.values()) if (level === 'CRITICAL') critical += 1;
  return { total: worst.size, critical, watch: worst.size - critical };
}

const isPositiveCount = (n: number) => Number.isFinite(n) && n > 0;

// Weighted by studentCount — a plain mean of per-course percentages would
// let a 1-student course count as much as a 60-student one.
export function overallAchievementPercent(
  courses: readonly Pick<InstructorCourseSummary, 'studentCount' | 'achievementPercent'>[],
): number | null {
  const counted = courses.filter(
    (c) => isPositiveCount(c.studentCount) && Number.isFinite(c.achievementPercent),
  );
  const totalStudents = counted.reduce((sum, c) => sum + c.studentCount, 0);
  if (totalStudents === 0) return null;
  const achieved = counted.reduce(
    (sum, c) => sum + (c.achievementPercent * c.studentCount) / 100,
    0,
  );
  return (achieved / totalStudents) * 100;
}

export type AchievementChangeDirection = 'up' | 'down' | 'flat';

export interface AchievementChange {
  direction: AchievementChangeDirection;
  // Signed percentage points (latest − previous); 0 when flat.
  delta: number;
}

// Mirrors the backend's SEMESTER_TERM_RANK (grade-point.constant.ts).
const SEMESTER_TERM_RANK: Record<SemesterTerm, number> = { FIRST: 1, SECOND: 2, SUMMER: 3 };

// Below half a point the change rounds to 0 at the whole points we show.
const FLAT_BELOW = 0.5;

type SemesterTotal = { academicYear: number; semesterTerm: SemesterTerm; students: number; achieved: number };

// Latest semester vs the one before it, across every course the instructor
// teaches. Each semesterTrend point is (students graded B+ / students) for one
// course in one term, so rounding percent × count recovers the exact head
// count and the cross-course figure is a true pooled percentage, not an
// average of averages. Fewer than two semesters with students → null.
export function computeAchievementChange(
  courses: readonly Pick<InstructorCourseSummary, 'semesterTrend'>[],
): AchievementChange | null {
  const bySemester = new Map<string, SemesterTotal>();
  for (const course of courses) {
    for (const point of course.semesterTrend) {
      if (!isPositiveCount(point.studentCount) || !Number.isFinite(point.achievementPercent)) continue;
      if (!(point.semesterTerm in SEMESTER_TERM_RANK)) continue;
      const key = `${point.academicYear}:${point.semesterTerm}`;
      const total = bySemester.get(key) ?? {
        academicYear: point.academicYear,
        semesterTerm: point.semesterTerm,
        students: 0,
        achieved: 0,
      };
      total.students += point.studentCount;
      total.achieved += Math.round((point.achievementPercent * point.studentCount) / 100);
      bySemester.set(key, total);
    }
  }

  const ordered = [...bySemester.values()].sort(
    (a, b) =>
      a.academicYear - b.academicYear ||
      SEMESTER_TERM_RANK[a.semesterTerm] - SEMESTER_TERM_RANK[b.semesterTerm],
  );
  if (ordered.length < 2) return null;

  const percent = (t: SemesterTotal) => (t.achieved / t.students) * 100;
  const delta = percent(ordered[ordered.length - 1]) - percent(ordered[ordered.length - 2]);
  if (!Number.isFinite(delta)) return null;
  if (Math.abs(delta) < FLAT_BELOW) return { direction: 'flat', delta: 0 };
  return { direction: delta > 0 ? 'up' : 'down', delta };
}

// Says "เทอมล่าสุด" because the headline figure beside it is cumulative while
// this compares single terms. `signed` adds the +/− sign for badges.
export function formatAchievementChange(
  change: AchievementChange,
  { signed }: { signed: boolean },
): string {
  if (change.direction === 'flat') return '– เทอมล่าสุดเท่ากับเทอมก่อน';
  const points = Math.round(Math.abs(change.delta));
  if (change.direction === 'up') return `เทอมล่าสุด ▲ ${signed ? '+' : ''}${points} จุดจากเทอมก่อน`;
  return `เทอมล่าสุด ▼ ${signed ? '−' : ''}${points} จุดจากเทอมก่อน`;
}

// One line for the dashboard header, most urgent first. Every part is dropped
// when its data is missing or not a real number, so the line never shows
// undefined/NaN. null = no courses at all (the page shows its own notice).
export function buildInstructorSummary(
  courses: readonly InstructorCourseSummary[],
): string | null {
  if (courses.length === 0) return null;
  if (!courses.some((c) => isPositiveCount(c.studentCount))) return NO_STUDENTS_SUMMARY;

  const followUps = countFollowUps(courses);
  const followUpPart =
    followUps.total > 0
      ? `ต้องติดตามนักศึกษา ${followUps.total} คน` +
        (followUps.critical > 0 ? ` (เร่งด่วน ${followUps.critical})` : '')
      : 'ยังไม่มีนักศึกษาที่ต้องติดตาม';

  const graded = courses.filter(
    (c) =>
      isPositiveCount(c.studentCount) &&
      Number.isFinite(c.achievementPercent) &&
      Number.isFinite(c.achievementThreshold),
  );
  // Same "worst first" order as interpret-instructor-courses.ts, so the course
  // named here is the one its recommendation also starts with.
  const below = graded
    .filter((c) => c.achievementPercent < c.achievementThreshold)
    .sort((a, b) => a.achievementPercent - b.achievementPercent);
  let coursePart: string | null = null;
  if (below.length > 0) {
    const first = below[0];
    coursePart =
      `${below.length} จาก ${graded.length} วิชาต่ำกว่าเกณฑ์ ` +
      `เริ่มที่ ${first.code} ${first.name} ${Math.round(first.achievementPercent)}% ` +
      `(เกณฑ์ ${first.achievementThreshold}%)`;
  } else if (graded.length > 0) {
    coursePart = graded.length < courses.length ? 'ทุกวิชาที่มีนักศึกษาผ่านเกณฑ์' : 'ทุกวิชาผ่านเกณฑ์';
  }

  const overall = overallAchievementPercent(courses);
  let achievementPart: string | null = null;
  if (overall !== null) {
    const change = computeAchievementChange(courses);
    achievementPart = `ผลสัมฤทธิ์เฉลี่ย ${Math.round(overall)}%`;
    if (change) achievementPart += ` (${formatAchievementChange(change, { signed: false })})`;
  }

  const parts =
    followUps.total > 0
      ? [followUpPart, coursePart, achievementPart]
      : [coursePart, achievementPart, followUpPart];
  return parts.filter((part): part is string => part !== null).join(' · ');
}
