import type {
  Grade,
  InstructorCourseSummary,
  InstructorCourseTimelineYear,
} from '@eduanalyze-ai/shared-types';
import { formatPercent } from './format-percent';
import { formatSemesterLabel } from './grade-label';
import {
  LOW_SAMPLE_BELOW,
  breakdownByYearLevel,
  buildCourseOverviews,
  statusOf,
  type GroupStats,
  type OverviewStatus,
  type SeatRow,
} from './instructor-overview';
import { SEMESTER_TERM_RANK } from './instructor-summary';

// One reading of one course, shared by the dashboard and the course page so the
// two can never disagree. Pure: it only regroups what the backend returned. It
// has no count of enrolled students (every source lists graded records only),
// so how much to trust a number is judged by how many people have a grade.

// Fewer graded people than this and no verdict is given at all.
export const INSUFFICIENT_BELOW = 5;
// A trend over fewer terms than this is two dots and a line: not a trend.
export const MIN_TERMS_FOR_TREND = 3;

export type DataLevel = 'insufficient' | 'low' | 'ok';

// Judged on the people counted in the "B or above" share (W and I left out).
// LOW_SAMPLE_BELOW is the same constant the other instructor pages use.
export function dataLevelOf(counted: number): DataLevel {
  if (!(counted >= INSUFFICIENT_BELOW)) return 'insufficient';
  return counted < LOW_SAMPLE_BELOW ? 'low' : 'ok';
}

// 'sparse' = too few graded people to say met / not met; shown as grey text.
export type SnapshotStatus = OverviewStatus | 'sparse';

export function snapshotStatus(stats: GroupStats, target: number | null): SnapshotStatus {
  if (stats.counted === 0) return 'none';
  if (dataLevelOf(stats.counted) === 'insufficient') return 'sparse';
  return statusOf(stats.achievedPercent, target);
}

// ---- header: which term and curriculum this course was last taught in ----

export interface CourseTermInfo {
  termLabel: string;
  curriculum: string;
}

export function courseTermInfo(
  years: readonly InstructorCourseTimelineYear[],
  courseId: string,
): CourseTermInfo | null {
  let best: { year: number; rank: number; info: CourseTermInfo } | null = null;
  for (const year of years) {
    for (const semester of year.semesters) {
      const rank = SEMESTER_TERM_RANK[semester.semesterTerm];
      const hit = semester.courses.find((c) => c.courseId === courseId);
      if (!hit || rank === undefined) continue;
      if (best && (year.academicYear < best.year || (year.academicYear === best.year && rank <= best.rank))) continue;
      best = {
        year: year.academicYear,
        rank,
        info: {
          termLabel: formatSemesterLabel(semester.semesterTerm, year.academicYear),
          curriculum: hit.programCode ? `หลักสูตร ${hit.programCode} ปี ${hit.curriculumYear}` : '',
        },
      };
    }
  }
  return best?.info ?? null;
}

// ---- the snapshot ----

export interface YearRow {
  yearLevel: number;
  stats: GroupStats;
  level: DataLevel;
  status: SnapshotStatus;
  // false = the percentage and grade average are hidden ("—").
  showNumbers: boolean;
}

export type GoalState = 'met' | 'unmet' | 'unknown';

export interface GoalItem {
  cloId: string;
  code: string;
  description: string;
  state: GoalState;
}

export const GRADE_ORDER: readonly Grade[] = ['A', 'B_PLUS', 'B', 'C_PLUS', 'C', 'D_PLUS', 'D', 'F'];

export interface GradeSegment {
  grade: Grade;
  count: number;
  // Share of the A to F grades, so the row adds up to 100.
  percent: number;
}

export interface TrendTerm {
  key: string;
  label: string;
  students: number;
  percent: number;
  level: DataLevel;
  showNumbers: boolean;
  isLatest: boolean;
}

export interface TrendChange {
  points: number;
  fromLabel: string;
  toLabel: string;
}

export interface CourseSnapshot {
  courseId: string;
  stats: GroupStats;
  target: number | null;
  level: DataLevel;
  status: SnapshotStatus;
  // No grade has been recorded for this course at all.
  empty: boolean;
  // null = year levels could not be loaded.
  years: { rows: YearRow[]; unplaced: number } | null;
  goals: { items: GoalItem[]; met: number; unmet: number; sparse: boolean };
  grades: {
    segments: GradeSegment[];
    scored: number;
    f: number;
    w: number;
    incomplete: number;
    notGraded: number;
  };
  trend: { termCount: number; enough: boolean; terms: TrendTerm[]; change: TrendChange | null };
}

export function buildCourseSnapshot({
  course,
  seatRows,
  yearLevelByStudent,
}: {
  course: InstructorCourseSummary;
  // This course's rows from GET /dashboard/instructor/students.
  seatRows: readonly SeatRow[];
  yearLevelByStudent: ReadonlyMap<string, number> | null;
}): CourseSnapshot {
  const { stats, target } = buildCourseOverviews([course])[0];
  const level = dataLevelOf(stats.counted);

  let years: CourseSnapshot['years'] = null;
  if (yearLevelByStudent) {
    const split = breakdownByYearLevel(seatRows, yearLevelByStudent);
    years = {
      unplaced: split.unplaced,
      rows: (split.byCourse.get(course.courseId) ?? []).map((cell) => {
        const cellLevel = dataLevelOf(cell.stats.counted);
        return {
          yearLevel: cell.yearLevel,
          stats: cell.stats,
          level: cellLevel,
          status: snapshotStatus(cell.stats, target),
          showNumbers: cellLevel !== 'insufficient',
        };
      }),
    };
  }

  // Met / not yet only: the backend has one share per course, so a goal's own
  // percentage is never shown. With too few people none is judged.
  const sparse = level === 'insufficient';
  const items: GoalItem[] = course.clos.map((clo) => ({
    cloId: clo.cloId,
    code: clo.code,
    description: clo.description,
    state: sparse ? 'unknown' : clo.isAchieved ? 'met' : 'unmet',
  }));

  const scored = GRADE_ORDER.reduce((sum, g) => sum + stats.counts[g], 0);
  const segments = GRADE_ORDER.map((grade) => ({
    grade,
    count: stats.counts[grade],
    percent: scored > 0 ? (stats.counts[grade] / scored) * 100 : 0,
  }));

  const trendPoints = course.semesterTrend;
  const terms: TrendTerm[] = trendPoints.map((p, i) => {
    const termLevel = dataLevelOf(p.studentCount);
    return {
      key: `${p.academicYear}-${p.semesterTerm}`,
      label: formatSemesterLabel(p.semesterTerm, p.academicYear),
      students: p.studentCount,
      percent: p.achievementPercent,
      level: termLevel,
      showNumbers: termLevel !== 'insufficient',
      isLatest: i === trendPoints.length - 1,
    };
  });
  const last = terms[terms.length - 1];
  const before = terms[terms.length - 2];
  const change: TrendChange | null =
    last && before && last.showNumbers && before.showNumbers
      ? {
          points: Math.round(last.percent) - Math.round(before.percent),
          fromLabel: before.label,
          toLabel: last.label,
        }
      : null;

  return {
    courseId: course.courseId,
    stats,
    target,
    level,
    status: snapshotStatus(stats, target),
    empty: stats.seats === 0,
    years,
    goals: {
      items,
      met: items.filter((g) => g.state === 'met').length,
      unmet: items.filter((g) => g.state === 'unmet').length,
      sparse,
    },
    grades: {
      segments,
      scored,
      f: stats.counts.F,
      w: stats.counts.W,
      incomplete: stats.counts.I,
      notGraded: stats.counts.S + stats.counts.U,
    },
    trend: {
      termCount: terms.length,
      enough: terms.length >= MIN_TERMS_FOR_TREND,
      terms,
      change,
    },
  };
}

// ---- words ----

export const SPARSE_LABEL = 'ข้อมูลยังน้อย';
export const SPARSE_SUMMARY = 'ข้อมูลยังน้อย — สรุปได้เบื้องต้น';
export const SPARSE_GOAL = 'ข้อมูลยังน้อย — ยังสรุปเป้าการเรียนรู้นี้ไม่ได้';
export const SPARSE_TREND = 'ข้อมูลยังน้อย — ยังไม่ควรสรุปแนวโน้ม';
export const EMPTY_SNAPSHOT = 'ยังไม่มีเกรดที่กรอก — เมื่อมีข้อมูล ระบบจะแสดงภาพรวมที่นี่';
export const DATA_SOURCE_NOTE = 'ข้อมูลล่าสุดจากเกรดที่บันทึกในระบบ';
export const SPARSE_YEAR_NOTE = 'ชั้นปีที่มีนักศึกษาที่ได้เกรดไม่ถึง 5 คน ไม่แสดงตัวเลข เพราะเปลี่ยนมากเมื่อเพิ่มหรือลดหนึ่งคน';

// A share set beside its goal. Whole numbers, except when it is under the goal
// but rounds up to it: then one decimal, cut down (never up), so 69.6 reads 69.6%
// and 69.99 reads 69.9%, not "70% ... below 70%". Only the text changes; the
// status is still judged on the real value.
export function formatShare(percent: number | null, target: number | null): string {
  if (percent === null || !Number.isFinite(percent)) return formatPercent(percent);
  if (target !== null && Number.isFinite(target) && percent < target && Math.round(percent) >= target) {
    return `${(Math.floor(percent * 10) / 10).toFixed(1)}%`;
  }
  return formatPercent(percent);
}

export function summaryLine(snapshot: Pick<CourseSnapshot, 'stats' | 'target' | 'status'>): string {
  const { stats, target } = snapshot;
  if (stats.achievedPercent === null) return SPARSE_SUMMARY;
  const goal = target === null ? '' : ` · เป้า ${formatPercent(target)}`;
  return `จากข้อมูลที่มี ${formatShare(stats.achievedPercent, target)} ได้ B ขึ้นไป${goal}`;
}

// People with a grade, and how many of them W and I leave out of the B-or-above share.
export function gradedPeopleParts(stats: GroupStats): { people: number; excluded: number } {
  return { people: stats.seats, excluded: stats.seats - stats.counted };
}

export function excludedNote(excluded: number): string | null {
  return excluded > 0 ? `ไม่รวมถอนหรือยังไม่สมบูรณ์ ${excluded} คน ในร้อยละ B ขึ้นไป` : null;
}

export function gradedPeopleLine(stats: GroupStats): string {
  const { people, excluded } = gradedPeopleParts(stats);
  const note = excludedNote(excluded);
  return `จากนักศึกษาที่มีเกรด ${people} คน${note ? ` (${note})` : ''}`;
}

export function changeLine(change: TrendChange): string {
  const { points, fromLabel } = change;
  const move = points === 0 ? 'ใกล้เคียงเดิม' : `${points > 0 ? 'เพิ่มขึ้น' : 'ลดลง'} ${Math.abs(points)} จุด`;
  return `จากข้อมูลที่มี ${move} เมื่อเทียบ${fromLabel}`;
}
