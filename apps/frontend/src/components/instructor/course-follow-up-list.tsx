import Link from 'next/link';
import type { AtRiskStudent } from '@eduanalyze-ai/shared-types';
import { gradeBadgeTone } from '@/lib/grade-badge-color';
import { GRADE_LABELS, formatSemesterLabel } from '@/lib/grade-label';
import { RISK_LEVEL_LABELS, RISK_LEVEL_ORDER, RISK_LEVEL_TONES } from '@/lib/risk-level';
import { PageSection } from '@/components/layout/page-section';
import { Badge } from '@/components/ui/badge';

// Keeps the overview short; the students tab lists everyone.
const MAX_VISIBLE = 5;

const rank = (level: AtRiskStudent['riskLevel']) => {
  const index = RISK_LEVEL_ORDER.indexOf(level);
  return index === -1 ? RISK_LEVEL_ORDER.length : index;
};

// Who in THIS course needs following up first. Reads course.atRiskStudents
// (latest attempt of each student, grade C or below), the same list the
// dashboard counts, so the numbers agree. Each row opens that student in the
// students tab.
export function CourseFollowUpList({
  courseId,
  students,
}: Readonly<{ courseId: string; students: AtRiskStudent[] }>) {
  const sorted = [...students].sort((a, b) => rank(a.riskLevel) - rank(b.riskLevel));
  const visible = sorted.slice(0, MAX_VISIBLE);
  const hidden = sorted.length - visible.length;
  const critical = sorted.filter((s) => s.riskLevel === 'CRITICAL').length;
  const watch = sorted.filter((s) => s.riskLevel === 'WATCH').length;

  return (
    <PageSection
      title={
        <span className="flex flex-wrap items-center gap-2">
          นักศึกษาที่ต้องติดตาม
          {critical > 0 && (
            <Badge tone={RISK_LEVEL_TONES.CRITICAL}>
              {RISK_LEVEL_LABELS.CRITICAL} {critical}
            </Badge>
          )}
          {watch > 0 && (
            <Badge tone={RISK_LEVEL_TONES.WATCH}>
              {RISK_LEVEL_LABELS.WATCH} {watch}
            </Badge>
          )}
        </span>
      }
      description="ผลการเรียนครั้งล่าสุดได้เกรด C ลงมา ประเมินจากเกรดรายวิชา"
    >
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">ยังไม่มีนักศึกษาที่ต้องติดตามในวิชานี้</p>
      ) : (
        <>
          <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
            {visible.map((s) => (
              <li key={s.studentProfileId}>
                <Link
                  href={`/instructor/courses/${courseId}?tab=students&student=${s.studentProfileId}`}
                  className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2 text-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="min-w-0">
                    <span className="block text-primary">{s.fullName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {s.studentCode} · {formatSemesterLabel(s.semesterTerm, s.academicYear)}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={gradeBadgeTone(s.grade)}>เกรด {GRADE_LABELS[s.grade]}</Badge>
                    <Badge tone={RISK_LEVEL_TONES[s.riskLevel]}>{RISK_LEVEL_LABELS[s.riskLevel]}</Badge>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {hidden > 0 && (
            <Link
              href={`/instructor/courses/${courseId}?tab=students`}
              className="inline-flex min-h-11 items-center text-sm text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              ดูอีก {hidden} คนในแท็บนักศึกษา
            </Link>
          )}
        </>
      )}
    </PageSection>
  );
}
