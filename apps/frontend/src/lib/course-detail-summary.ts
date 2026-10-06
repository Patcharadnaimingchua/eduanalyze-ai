import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { countFollowUps } from './follow-ups';
import { computeAchievementChange, formatAchievementChange } from './instructor-summary';

// Pure, rule-based header line for /instructor/courses/[courseId]. Reads only
// the course's entry in GET /dashboard/instructor, so the figures match the
// same course's row on the dashboard and nothing extra is fetched.

export const NO_STUDENTS_IN_COURSE = 'ยังไม่มีนักศึกษาลงทะเบียนในวิชานี้';

const isPositiveCount = (n: number) => Number.isFinite(n) && n > 0;

// Parts, most useful first, each dropped when its data is missing or not a
// real number: achievement vs the bar, people to follow up, CLO status, then
// the latest-term arrow.
export function buildCourseDetailSummary(
  course: Pick<
    InstructorCourseSummary,
    | 'studentCount'
    | 'achievementPercent'
    | 'achievementThreshold'
    | 'atRiskStudents'
    | 'clos'
    | 'semesterTrend'
  >,
): string {
  if (!isPositiveCount(course.studentCount)) return NO_STUDENTS_IN_COURSE;

  const parts: string[] = [];

  if (Number.isFinite(course.achievementPercent)) {
    const percent = `ผลสัมฤทธิ์ ${Math.round(course.achievementPercent)}%`;
    if (Number.isFinite(course.achievementThreshold)) {
      const verdict = course.achievementPercent < course.achievementThreshold ? 'ต่ำกว่าเกณฑ์' : 'ผ่านเกณฑ์';
      parts.push(`${percent} ${verdict} ${course.achievementThreshold}%`);
    } else {
      parts.push(percent);
    }
  }

  const followUps = countFollowUps([course]);
  parts.push(
    followUps.total > 0
      ? `ต้องติดตาม ${followUps.total} คน` +
          (followUps.critical > 0 ? ` (เร่งด่วน ${followUps.critical})` : '')
      : 'ยังไม่มีนักศึกษาที่ต้องติดตาม',
  );

  if (course.clos.length > 0) {
    const missed = course.clos.filter((clo) => !clo.isAchieved).length;
    parts.push(
      missed > 0 ? `CLO ยังไม่ผ่าน ${missed} จาก ${course.clos.length}` : `CLO ผ่านครบ ${course.clos.length} ข้อ`,
    );
  }

  const change = computeAchievementChange([course]);
  if (change) parts.push(formatAchievementChange(change, { signed: false }));

  return parts.join(' · ');
}
