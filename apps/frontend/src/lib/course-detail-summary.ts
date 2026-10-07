import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { SPARSE_SUMMARY, dataLevelOf, formatShare } from './course-snapshot';
import { countFollowUps } from './follow-ups';
import { STATUS_META, emptyCounts, statusOf, summarizeParts } from './instructor-overview';
import { computeAchievementChange, formatAchievementChange } from './instructor-summary';

// Pure, rule-based header line for /instructor/courses/[courseId]. Reads only
// the course's entry in GET /dashboard/instructor, so the figures match the
// same course's row on the dashboard and nothing extra is fetched.

export const NO_STUDENTS_IN_COURSE = 'ยังไม่มีนักศึกษาลงทะเบียนในวิชานี้';

// Parts, most useful first, each dropped when its data is missing or not a
// real number: achievement vs the bar, people to follow up, CLO status, then
// the latest-term arrow. The share and its verdict come from the same reading
// as the overview below (course-snapshot), never from the backend's own
// percent, so the two lines cannot disagree; under 5 graded people no verdict
// is given.
export function buildCourseDetailSummary(
  course: Pick<
    InstructorCourseSummary,
    'gradeDistribution' | 'achievementThreshold' | 'atRiskStudents' | 'clos' | 'semesterTrend'
  >,
): string {
  const stats = summarizeParts([{ counts: { ...emptyCounts(), ...course.gradeDistribution }, credits: null }]);
  if (stats.seats === 0) return NO_STUDENTS_IN_COURSE;

  const parts: string[] = [];
  const sparse = dataLevelOf(stats.counted) === 'insufficient';

  if (sparse) {
    parts.push(SPARSE_SUMMARY);
  } else if (stats.achievedPercent !== null) {
    const target = Number.isFinite(course.achievementThreshold) ? course.achievementThreshold : null;
    const percent = `ได้ B ขึ้นไป ${formatShare(stats.achievedPercent, target)}`;
    parts.push(
      target === null
        ? percent
        : `${percent} ${STATUS_META[statusOf(stats.achievedPercent, target)].label} ${target}%`,
    );
  }

  const followUps = countFollowUps([course]);
  parts.push(
    followUps.total > 0
      ? `ต้องติดตาม ${followUps.total} คน` +
          (followUps.critical > 0 ? ` (เร่งด่วน ${followUps.critical})` : '')
      : 'ยังไม่มีนักศึกษาที่ต้องติดตาม',
  );

  if (!sparse && course.clos.length > 0) {
    const missed = course.clos.filter((clo) => !clo.isAchieved).length;
    parts.push(
      missed > 0 ? `เป้าการเรียนรู้ยังไม่ผ่าน ${missed} จาก ${course.clos.length}` : `เป้าการเรียนรู้ผ่านครบ ${course.clos.length} ข้อ`,
    );
  }

  const change = computeAchievementChange([course]);
  if (change) parts.push(formatAchievementChange(change, { signed: false }));

  return parts.join(' · ');
}
