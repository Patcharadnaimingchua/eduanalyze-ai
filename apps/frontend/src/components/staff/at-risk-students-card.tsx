'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import type { StaffAtRiskStudent } from '@eduanalyze-ai/shared-types';
import { gradeBadgeTone } from '@/lib/grade-badge-color';
import { GRADE_LABELS } from '@/lib/grade-label';
import { RISK_LEVEL_LABELS, RISK_LEVEL_TONES } from '@/lib/risk-level';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Sibling of the instructor card, grouped by student rather than by
// course: a staff scope spans many courses, so the same student would
// otherwise appear once per course they are failing.
export function AtRiskStudentsCard({
  students,
  summary,
}: {
  students: StaffAtRiskStudent[];
  summary: { critical: number; watch: number };
}) {
  const total = summary.critical + summary.watch;
  const hidden = total - students.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          นักศึกษากลุ่มเสี่ยง
          {summary.critical > 0 && (
            <Badge tone="danger">
              {RISK_LEVEL_LABELS.CRITICAL} {summary.critical}
            </Badge>
          )}
          {summary.watch > 0 && (
            <Badge tone="warning">
              {RISK_LEVEL_LABELS.WATCH} {summary.watch}
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          จัดระดับจากเกรดที่แย่ที่สุดของแต่ละคน — {RISK_LEVEL_LABELS.CRITICAL} (D+, D, F,
          U) และ {RISK_LEVEL_LABELS.WATCH} (C) ประเมินจากเกรดรายวิชา ไม่ใช่ผลประเมิน CLO
          รายบุคคล
        </p>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            ไม่มีนักศึกษาที่อยู่ในกลุ่มเสี่ยงในขอบเขตของคุณ
          </p>
        ) : (
          <div className="space-y-2">
            <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
              {students.map((student) => (
                <li
                  key={student.studentProfileId}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <span className="min-w-0">
                    <Link
                      href={`/staff/students/${student.studentProfileId}`}
                      className="text-brand hover:underline"
                    >
                      <span className="text-muted-foreground">{student.studentCode}</span>{' '}
                      {student.fullName}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {student.programCode}/{student.curriculumVersion}
                      {student.gpa !== null && ` · GPA ${student.gpa.toFixed(2)}`}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      เสี่ยง {student.atRiskCourseCount} วิชา
                    </span>
                    <Badge tone={RISK_LEVEL_TONES[student.riskLevel]}>
                      {RISK_LEVEL_LABELS[student.riskLevel]}
                    </Badge>
                    <Badge tone={gradeBadgeTone(student.worstGrade)}>
                      {GRADE_LABELS[student.worstGrade]}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
            {hidden > 0 && (
              <p className="text-xs text-muted-foreground">
                แสดง {students.length} จาก {total} คน —{' '}
                <Link href="/staff/students" className="text-brand hover:underline">
                  ดูทั้งหมดในรายชื่อนักศึกษา
                </Link>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
