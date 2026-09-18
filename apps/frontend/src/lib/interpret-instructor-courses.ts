import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { formatSemesterLabel } from './grade-label';

// Rule-based, deterministic reading of the instructor's own course list —
// no network call, no cost, same output shape as PloInterpretation /
// AiSkillAnalysisReport (minus its id/timestamp fields). Same reasoning as
// interpret-plo-radar.ts: this runs on every dashboard view, and the
// numbers it describes are already computed server-side, so a model call
// would add latency and cost without adding information.
//
// Reads only what fetchInstructorDashboard already returned, so it stays
// inside the "courses I teach" boundary by construction.
export interface InstructorCoursesInsight {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export const NO_COURSES_SUMMARY = 'ยังไม่มีรายวิชาที่คุณสอนในระบบ';
export const NO_STUDENTS_SUMMARY =
  'ยังไม่มีนักศึกษาลงทะเบียนในรายวิชาที่คุณสอน จึงยังสรุปผลสัมฤทธิ์ไม่ได้';

function label(course: InstructorCourseSummary): string {
  return `${course.code} ${course.name}`;
}

// A course's own latest semester vs the one before it. Only meaningful
// with at least two points, and semesterTrend is already chronological.
function semesterTrendDelta(course: InstructorCourseSummary) {
  const trend = course.semesterTrend;
  if (trend.length < 2) return null;
  const latest = trend.at(-1)!;
  const previous = trend.at(-2)!;
  return { latest, previous, delta: latest.achievementPercent - previous.achievementPercent };
}

export function interpretInstructorCourses(
  courses: InstructorCourseSummary[],
): InstructorCoursesInsight {
  if (courses.length === 0) {
    return { summary: NO_COURSES_SUMMARY, strengths: [], weaknesses: [], recommendations: [] };
  }

  const withStudents = courses.filter((c) => c.studentCount > 0);
  const empty = courses.filter((c) => c.studentCount === 0);

  if (withStudents.length === 0) {
    return { summary: NO_STUDENTS_SUMMARY, strengths: [], weaknesses: [], recommendations: [] };
  }

  const meeting = withStudents.filter((c) => c.achievementPercent >= c.achievementThreshold);
  const below = withStudents
    .filter((c) => c.achievementPercent < c.achievementThreshold)
    .sort((a, b) => a.achievementPercent - b.achievementPercent);

  const totalStudents = withStudents.reduce((sum, c) => sum + c.studentCount, 0);
  const criticalCount = courses.reduce(
    (sum, c) => sum + c.atRiskStudents.filter((s) => s.riskLevel === 'CRITICAL').length,
    0,
  );
  const watchCount = courses.reduce(
    (sum, c) => sum + c.atRiskStudents.filter((s) => s.riskLevel === 'WATCH').length,
    0,
  );

  const summary =
    `จาก ${withStudents.length} รายวิชาที่มีนักศึกษา (รวม ${totalStudents} คน) ` +
    `มี ${meeting.length} วิชาที่ผลสัมฤทธิ์ถึงเกณฑ์ และ ${below.length} วิชาที่ยังไม่ถึงเกณฑ์` +
    (criticalCount + watchCount > 0
      ? ` มีนักศึกษาที่ต้องติดตาม ${criticalCount + watchCount} คน (เร่งด่วน ${criticalCount} คน)`
      : ' และยังไม่มีนักศึกษาที่ต้องติดตาม');

  return {
    summary,
    strengths: buildStrengths(meeting, withStudents),
    weaknesses: buildWeaknesses(below, withStudents, empty),
    recommendations: buildRecommendations(below, withStudents, criticalCount, watchCount),
  };
}

function buildStrengths(
  meeting: InstructorCourseSummary[],
  withStudents: InstructorCourseSummary[],
): string[] {
  const out = [...meeting]
    .sort((a, b) => b.achievementPercent - a.achievementPercent)
    .map(
      (course) =>
        `${label(course)} มีผลสัมฤทธิ์ ${Math.round(course.achievementPercent)}% ` +
        `ถึงเกณฑ์ ${course.achievementThreshold}% ที่หลักสูตรกำหนด`,
    );

  for (const course of withStudents) {
    const trend = semesterTrendDelta(course);
    if (trend && trend.delta > 0) {
      out.push(
        `${label(course)} ผลรายเทอมดีขึ้น จาก ${Math.round(trend.previous.achievementPercent)}% ` +
          `เป็น ${Math.round(trend.latest.achievementPercent)}% ` +
          `ใน${formatSemesterLabel(trend.latest.semesterTerm, trend.latest.academicYear)}`,
      );
    }
  }
  return out;
}

function buildWeaknesses(
  below: InstructorCourseSummary[],
  withStudents: InstructorCourseSummary[],
  empty: InstructorCourseSummary[],
): string[] {
  const out = below.map(
    (course) =>
      `${label(course)} มีผลสัมฤทธิ์ ${Math.round(course.achievementPercent)}% ` +
      `ต่ำกว่าเกณฑ์ ${course.achievementThreshold}% อยู่ ` +
      `${Math.round(course.achievementThreshold - course.achievementPercent)} จุด`,
  );

  for (const course of withStudents) {
    const critical = course.atRiskStudents.filter((s) => s.riskLevel === 'CRITICAL').length;
    if (critical > 0) {
      out.push(
        `${label(course)} มีนักศึกษาระดับเร่งด่วน ${critical} คน ` +
          `จากทั้งหมด ${course.studentCount} คน`,
      );
    }
  }
  for (const course of withStudents) {
    const trend = semesterTrendDelta(course);
    if (trend && trend.delta < 0) {
      out.push(
        `${label(course)} ผลรายเทอมลดลง จาก ${Math.round(trend.previous.achievementPercent)}% ` +
          `เหลือ ${Math.round(trend.latest.achievementPercent)}% ` +
          `ใน${formatSemesterLabel(trend.latest.semesterTerm, trend.latest.academicYear)}`,
      );
    }
  }
  for (const course of empty) {
    out.push(`${label(course)} ยังไม่มีนักศึกษาลงทะเบียน จึงยังไม่มีผลสัมฤทธิ์ให้ประเมิน`);
  }
  return out;
}

function buildRecommendations(
  below: InstructorCourseSummary[],
  withStudents: InstructorCourseSummary[],
  criticalCount: number,
  watchCount: number,
): string[] {
  const out: string[] = [];

  if (below.length > 0) {
    out.push(
      `เริ่มจาก ${label(below[0])} ซึ่งห่างจากเกณฑ์มากที่สุด ` +
        `ลองทบทวน CLO ที่ยังไม่ผ่านในแท็บ CLO Achievement`,
    );
  }
  if (criticalCount > 0) {
    out.push(
      `ติดตามนักศึกษาระดับเร่งด่วน ${criticalCount} คนก่อน ` +
        `เปิด Gradebook แล้วกรองด้วยระดับ "เร่งด่วน" เพื่อดูรายชื่อ`,
    );
  }
  if (watchCount > 0) {
    out.push(
      `นักศึกษาระดับเฝ้าระวัง ${watchCount} คนยังพอแก้ไขทัน ควรตรวจสอบก่อนผลจะตกไปกว่านี้`,
    );
  }

  const dropped = withStudents.filter((c) => (semesterTrendDelta(c)?.delta ?? 0) < 0);
  if (dropped.length > 0) {
    out.push(
      `${dropped.map(label).join(', ')} มีผลรายเทอมลดลง ` +
        `ลองเทียบวิธีวัดผลระหว่างสองเทอมในแท็บแนวโน้มรายเทอม`,
    );
  }

  return out.length > 0
    ? out
    : ['ทุกรายวิชาผ่านเกณฑ์และไม่มีนักศึกษาที่ต้องติดตาม ควรรักษาระดับนี้ต่อไป'];
}
