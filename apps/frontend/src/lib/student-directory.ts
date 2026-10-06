import type { InstructorStudentEntry, RiskLevel } from '@eduanalyze-ai/shared-types';
import { RISK_LEVEL_ORDER } from './risk-level';

// Pure helpers for /instructor/students. They only regroup the rows
// GET /dashboard/instructor/students already returned (one row per student ×
// course, riskLevel from the backend's riskLevel()), so they cannot widen the
// instructor's scope and never re-derive risk from grades.

export const ALL = 'ALL';
export type RiskFilter = RiskLevel | typeof ALL;

export interface StudentFilters {
  risk: RiskFilter;
  courseId: string;
  q: string;
}

export const DEFAULT_STUDENT_FILTERS: StudentFilters = { risk: ALL, courseId: ALL, q: '' };

// One card per person. `primary` is the course to show first: the worst risk,
// then course code. `others` are the rest in the same order.
export interface StudentPerson {
  studentProfileId: string;
  studentCode: string;
  fullName: string;
  worstRisk: RiskLevel;
  primary: InstructorStudentEntry;
  others: InstructorStudentEntry[];
}

export type RiskCounts = Record<RiskLevel, number> & { total: number };

const rank = (level: RiskLevel) => {
  const index = RISK_LEVEL_ORDER.indexOf(level);
  return index === -1 ? RISK_LEVEL_ORDER.length : index;
};

const byRiskThenCourse = (a: InstructorStudentEntry, b: InstructorStudentEntry) =>
  rank(a.riskLevel) - rank(b.riskLevel) || a.courseCode.localeCompare(b.courseCode);

export function groupByPerson(entries: readonly InstructorStudentEntry[]): StudentPerson[] {
  const rowsById = new Map<string, InstructorStudentEntry[]>();
  for (const entry of entries) {
    const rows = rowsById.get(entry.studentProfileId) ?? [];
    rows.push(entry);
    rowsById.set(entry.studentProfileId, rows);
  }
  return [...rowsById.values()].map((rows) => {
    const [primary, ...others] = [...rows].sort(byRiskThenCourse);
    return {
      studentProfileId: primary.studentProfileId,
      studentCode: primary.studentCode,
      fullName: primary.fullName,
      worstRisk: primary.riskLevel,
      primary,
      others,
    };
  });
}

// Worst level first, then student code — who to follow up comes first.
export function sortPeopleByRisk(people: readonly StudentPerson[]): StudentPerson[] {
  return [...people].sort(
    (a, b) => rank(a.worstRisk) - rank(b.worstRisk) || a.studentCode.localeCompare(b.studentCode),
  );
}

export function countByRisk(people: readonly Pick<StudentPerson, 'worstRisk'>[]): RiskCounts {
  const counts: RiskCounts = { CRITICAL: 0, WATCH: 0, NORMAL: 0, total: 0 };
  for (const person of people) {
    if (!(person.worstRisk in counts)) continue;
    counts[person.worstRisk] += 1;
    counts.total += 1;
  }
  return counts;
}

const matchesQuery = (person: StudentPerson, q: string) => {
  const term = q.trim().toLowerCase();
  if (term === '') return true;
  return (
    person.studentCode.toLowerCase().includes(term) || person.fullName.toLowerCase().includes(term)
  );
};

// Course and search narrow the people first; `counts` is taken at that point so
// each risk button shows how many people it would leave. The risk filter then
// picks people by their worst level within the remaining courses, the same
// per-person level the counts and the dashboard use.
export function applyStudentFilters(
  entries: readonly InstructorStudentEntry[],
  filters: StudentFilters,
): { people: StudentPerson[]; counts: RiskCounts } {
  const inCourse =
    filters.courseId === ALL ? entries : entries.filter((e) => e.courseId === filters.courseId);
  const narrowed = groupByPerson(inCourse).filter((p) => matchesQuery(p, filters.q));
  const counts = countByRisk(narrowed);
  const people =
    filters.risk === ALL ? narrowed : narrowed.filter((p) => p.worstRisk === filters.risk);
  return { people: sortPeopleByRisk(people), counts };
}

// Anything unknown falls back to the default, so a stale or hand-edited URL
// never leaves the page in a state the controls cannot show. A course the
// instructor does not teach simply matches no rows.
export function parseStudentFilters(params: { get(name: string): string | null }): StudentFilters {
  const risk = params.get('risk');
  return {
    risk: RISK_LEVEL_ORDER.includes(risk as RiskLevel) ? (risk as RiskLevel) : ALL,
    courseId: params.get('course')?.trim() || ALL,
    q: params.get('q') ?? '',
  };
}

// Default values are left out so the plain page keeps a clean URL.
export function studentFiltersToQuery(filters: StudentFilters): string {
  const params = new URLSearchParams();
  if (filters.risk !== ALL) params.set('risk', filters.risk);
  if (filters.courseId !== ALL) params.set('course', filters.courseId);
  if (filters.q.trim() !== '') params.set('q', filters.q.trim());
  return params.toString();
}

export const NO_STUDENTS_IN_COURSES = 'ยังไม่มีนักศึกษาในรายวิชาที่คุณสอน';

// Header line, people not rows, from the unfiltered list. null = nothing to say
// (no data loaded yet or no courses at all).
export function buildStudentsSummary(
  entries: readonly InstructorStudentEntry[],
  courseCount: number,
): string | null {
  if (entries.length === 0) return courseCount > 0 ? NO_STUDENTS_IN_COURSES : null;
  const counts = countByRisk(groupByPerson(entries));
  const courses = new Set(entries.map((e) => e.courseId)).size;
  const population = `นักศึกษา ${counts.total} คนใน ${courses} วิชา`;
  const followUps = counts.CRITICAL + counts.WATCH;
  if (followUps === 0) return `${population} · ยังไม่มีนักศึกษาที่ต้องติดตาม`;
  const critical = counts.CRITICAL > 0 ? ` (เร่งด่วน ${counts.CRITICAL})` : '';
  return `ต้องติดตาม ${followUps} คน${critical} จาก${population}`;
}

// ---- /instructor/year-levels: risk badges and the header line ----

// Worst level per student across every course the instructor teaches, keyed by
// studentProfileId. A student missing from the map has no row in the students
// report, so their level is unknown (not "normal").
export function worstRiskById(
  entries: readonly InstructorStudentEntry[],
): Map<string, RiskLevel> {
  return new Map(groupByPerson(entries).map((p) => [p.studentProfileId, p.worstRisk]));
}

interface YearLevelBucketLike {
  yearLevel: number;
  label: string;
  students: readonly { studentProfileId: string; onTrackStatus: 'on_track' | 'behind' | null }[];
}

export function buildYearLevelsSummary(
  buckets: readonly YearLevelBucketLike[],
  riskById: ReadonlyMap<string, RiskLevel> | null,
): string | null {
  const total = buckets.reduce((sum, b) => sum + b.students.length, 0);
  if (total === 0) return null;
  const parts = [`นักศึกษา ${total} คน`];

  if (riskById) {
    const perLevel = buckets.map((b) => ({
      label: b.label,
      count: b.students.filter((s) => {
        const level = riskById.get(s.studentProfileId);
        return level === 'CRITICAL' || level === 'WATCH';
      }).length,
    }));
    const followUps = perLevel.reduce((sum, l) => sum + l.count, 0);
    if (followUps === 0) {
      parts.push('ยังไม่มีนักศึกษาที่ต้องติดตามในวิชาของคุณ');
    } else {
      const most = Math.max(...perLevel.map((l) => l.count));
      const where = perLevel
        .filter((l) => l.count === most)
        .map((l) => l.label)
        .join(' และ ');
      parts.push(`ต้องติดตามในวิชาของคุณ ${followUps} คน (มากสุดที่${where})`);
    }
  }

  const behind = buckets.reduce(
    (sum, b) => sum + b.students.filter((s) => s.onTrackStatus === 'behind').length,
    0,
  );
  if (behind > 0) parts.push(`ตามหลังแผน ${behind} คน`);
  return parts.join(' · ');
}
