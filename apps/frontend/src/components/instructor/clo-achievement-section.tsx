'use client';

import { useMemo, useState } from 'react';
import type {
  CloAchievementEntry,
  CoursePloEntry,
  CourseCloAchievementReport,
  Grade,
  StudentRosterEntry,
} from '@eduanalyze-ai/shared-types';
import { ploProgressBarColorClassName } from '@/lib/plo-color';
import { formatFiveScale, percentToFiveScale } from '@/lib/five-scale';
import { GRADE_LABELS } from '@/lib/grade-label';
import { gradeBadgeTone } from '@/lib/grade-badge-color';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PageSection } from '@/components/layout/page-section';
import { achievementStatus } from '@/lib/achievement-status';
import { EvidenceCoverageBadge } from './evidence-coverage-badge';

// Mirrors ACHIEVED_GRADES in
// apps/backend/src/modules/academic-record/student-course-record/grade-point.constant.ts
// — keep in sync if that changes. Duplicated rather than shared because the
// grade-based achievementPercent above is already computed this same way
// server-side; this just reproduces the per-student split from data the
// roster already carries, without a new endpoint.
const ACHIEVED_GRADES = new Set<Grade>(['A', 'B_PLUS', 'B']);

interface CourseAssessmentSummary {
  courseId: string;
  submissionCount: number;
  clos: { cloId: string; code: string; averageScore: number | null; scoreCount: number }[];
}

export function CloAchievementSection({
  achievementPercent,
  achievementThreshold,
  clos,
  plos,
  courseAssessment,
  detail,
  isLoading,
  isError,
  evidenceCoverage,
  evidenceTotal,
  evidenceError,
  roster,
  onViewRoster,
}: Readonly<{
  achievementPercent: number;
  achievementThreshold: number;
  clos: CloAchievementEntry[];
  plos: CoursePloEntry[];
  courseAssessment: CourseAssessmentSummary;
  detail: CourseCloAchievementReport | undefined;
  isLoading: boolean;
  isError: boolean;
  // Per-CLO count of students with a graded score. Sits *beside* the
  // grade-based percentages above — never replaces them: there is no
  // course-level evidence endpoint, and computing that percentage in the
  // browser would fork the backend's Decimal arithmetic. See
  // lib/evidence-coverage.ts.
  evidenceCoverage: Map<string, number> | undefined;
  evidenceTotal: number | undefined;
  evidenceError: boolean;
  // Same roster the Gradebook tab fetches — reused here (no new request)
  // so a CRITICAL CLO row can drill down into who's behind, per grade.
  roster: StudentRosterEntry[] | undefined;
  onViewRoster: () => void;
}>) {
  const [expandedCloId, setExpandedCloId] = useState<string | null>(null);
  const courseStatus = achievementStatus(achievementPercent, achievementThreshold);

  // Grade-based achievement has no per-CLO breakdown (see ACHIEVED_GRADES
  // comment above) — the same failing-student list applies to every
  // CRITICAL CLO in this course, computed once here rather than per row.
  const failingStudents = useMemo(
    () => (roster ?? []).filter((s) => !ACHIEVED_GRADES.has(s.grade)),
    [roster],
  );

  const scoredAssessmentClos = useMemo(
    () => courseAssessment.clos.filter((c) => c.averageScore !== null && c.scoreCount > 0),
    [courseAssessment.clos],
  );
  const lowestAssessmentCloId = useMemo(
    () =>
      scoredAssessmentClos.length === 0
        ? null
        : scoredAssessmentClos.reduce(
            (min, c) => (c.averageScore! < min.averageScore! ? c : min),
            scoredAssessmentClos[0],
          ).cloId,
    [scoredAssessmentClos],
  );
  const highestAssessmentCloId = useMemo(
    () =>
      scoredAssessmentClos.length === 0
        ? null
        : scoredAssessmentClos.reduce(
            (max, c) => (c.averageScore! > max.averageScore! ? c : max),
            scoredAssessmentClos[0],
          ).cloId,
    [scoredAssessmentClos],
  );

  return (
    <div className="space-y-5">
      <PageSection title="ผลสัมฤทธิ์ CLO โดยรวม">
        <div className="flex items-center gap-3">
          <Progress value={achievementPercent} className="flex-1" barClassName="bg-emerald-600" />
          <Badge tone={courseStatus.tone}>{courseStatus.label}</Badge>
          <span className="shrink-0 text-sm font-medium text-primary">
            {formatFiveScale(achievementPercent)}
          </span>
        </div>
        {isLoading && <Skeleton className="h-3 w-40" />}
        {isError && (
          <p className="text-xs text-destructive">ไม่สามารถโหลดจำนวนนักศึกษาที่ผ่านเกณฑ์ได้</p>
        )}
        {detail && (
          <p className="text-xs text-muted-foreground">
            {detail.achievedStudents} จาก {detail.totalStudents} คนผ่านเกณฑ์
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          ตัวเลขนี้คำนวณจากเกรดรายวิชา (สัดส่วนนักศึกษาที่ได้ ≥ B) ไม่ใช่จากคะแนนหลักฐานรายชิ้น
        </p>
      </PageSection>

      <PageSection title="รายการ CLO">
        {clos.map((clo) => {
          // Same course-level achievementPercent for every CLO (backend
          // limitation), but each CLO may set its own threshold.
          const cloStatus = achievementStatus(achievementPercent, clo.threshold);
          const isCritical = cloStatus.tone === 'danger';
          const isExpanded = expandedCloId === clo.cloId;
          return (
            <div key={clo.cloId} className="rounded-md bg-slate-50 px-3 py-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">{clo.code}</p>
                  <p className="text-sm text-primary">{clo.description}</p>
                  <p className="text-xs text-muted-foreground">
                    เกณฑ์ผ่าน ≥ {percentToFiveScale(clo.threshold).toFixed(1)}
                  </p>
                  {isCritical && roster && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-auto px-0 text-xs text-brand hover:bg-transparent hover:underline"
                      onClick={() => setExpandedCloId(isExpanded ? null : clo.cloId)}
                    >
                      {isExpanded ? 'ซ่อนรายชื่อ' : `ดูรายชื่อนักศึกษาที่ยังไม่ผ่าน (${failingStudents.length} คน)`}
                    </Button>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge tone={cloStatus.tone}>{cloStatus.label}</Badge>
                  {evidenceError ? (
                    <span className="text-xs text-destructive">โหลดหลักฐานไม่สำเร็จ</span>
                  ) : (
                    evidenceTotal !== undefined &&
                    evidenceCoverage !== undefined && (
                      <EvidenceCoverageBadge
                        coverage={{
                          validCount: evidenceCoverage.get(clo.cloId) ?? 0,
                          totalCount: evidenceTotal,
                        }}
                      />
                    )
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-2 space-y-2 border-t border-slate-200 pt-2">
                  <p className="text-xs text-muted-foreground">
                    รายชื่อนี้คำนวณจากเกรดรวมวิชา (เหมือนกันทุก CLO ที่ยังไม่ผ่านในวิชานี้)
                    ไม่ใช่คะแนนเฉพาะ CLO นี้ — schema ยังไม่รองรับคะแนนแยกต่อ CLO ในฝั่งเกรด
                  </p>
                  {failingStudents.length === 0 ? (
                    <p className="text-xs text-muted-foreground">ไม่มีนักศึกษาที่เกรดต่ำกว่าเกณฑ์</p>
                  ) : (
                    <ul className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">
                      {failingStudents.map((s) => (
                        <li
                          key={s.studentProfileId}
                          className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm"
                        >
                          <span className="min-w-0">
                            <span className="text-muted-foreground">{s.studentCode}</span>{' '}
                            <span className="text-primary">{s.fullName}</span>
                          </span>
                          <Badge tone={gradeBadgeTone(s.grade)}>{GRADE_LABELS[s.grade]}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={onViewRoster}
                    className="text-xs text-brand hover:underline"
                  >
                    ไปที่ Gradebook →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </PageSection>

      {plos.length > 0 && (
        <PageSection title="PLO ที่เกี่ยวข้อง" className="border-t border-slate-100 pt-3">
          {plos.map((plo) => (
            <div key={plo.ploId} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {plo.code} · {plo.name}
                </span>
                <span className="font-medium text-primary">
                  {formatFiveScale(plo.achievementPercent)}
                </span>
              </div>
              <Progress
                value={plo.achievementPercent}
                barClassName={ploProgressBarColorClassName(plo.achievementPercent, null)}
              />
            </div>
          ))}
        </PageSection>
      )}

      {scoredAssessmentClos.length > 0 && (
        <PageSection
          title="คะแนนประเมินตนเองเฉลี่ยต่อ CLO (1-5)"
          className="border-t border-slate-100 pt-3"
        >
          {scoredAssessmentClos.map((c) => (
            <div key={c.cloId} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {c.code}
                {c.cloId === highestAssessmentCloId && (
                  <span className="ml-1.5 text-xs text-emerald-600">(สูงสุด)</span>
                )}
                {c.cloId === lowestAssessmentCloId && c.cloId !== highestAssessmentCloId && (
                  <span className="ml-1.5 text-xs text-amber-600">(ต่ำสุด)</span>
                )}
              </span>
              <span className="font-medium text-primary">{c.averageScore!.toFixed(1)}</span>
            </div>
          ))}
        </PageSection>
      )}
    </div>
  );
}
