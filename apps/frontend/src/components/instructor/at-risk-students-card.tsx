'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { gradeBadgeTone } from '@/lib/grade-badge-color';
import { GRADE_LABELS, formatSemesterLabel } from '@/lib/grade-label';
import { RISK_LEVEL_LABELS, RISK_LEVEL_TONES } from '@/lib/risk-level';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AtRiskStudentsCard({ courses }: { courses: InstructorCourseSummary[] }) {
  const coursesWithRisk = courses.filter((c) => c.atRiskStudents.length > 0);
  const atRisk = coursesWithRisk.flatMap((c) => c.atRiskStudents);
  const criticalCount = atRisk.filter((s) => s.riskLevel === 'CRITICAL').length;
  const watchCount = atRisk.filter((s) => s.riskLevel === 'WATCH').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          นักศึกษากลุ่มเสี่ยง
          {criticalCount > 0 && (
            <Badge tone="danger">
              {RISK_LEVEL_LABELS.CRITICAL} {criticalCount}
            </Badge>
          )}
          {watchCount > 0 && (
            <Badge tone="warning">
              {RISK_LEVEL_LABELS.WATCH} {watchCount}
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          ผลการเรียนครั้งล่าสุดได้เกรด C ลงมา — แบ่งเป็น{' '}
          {RISK_LEVEL_LABELS.CRITICAL} (D+, D, F, U) และ {RISK_LEVEL_LABELS.WATCH} (C)
          ประเมินจากเกรดรายวิชา ไม่ใช่ผลประเมิน CLO รายบุคคล
        </p>
      </CardHeader>
      <CardContent>
        {coursesWithRisk.length === 0 ? (
          <p className="text-sm text-muted-foreground">ไม่มีนักศึกษาที่อยู่ในกลุ่มเสี่ยง</p>
        ) : (
          <div className="space-y-4">
            {coursesWithRisk.map((course) => (
              <div key={course.courseId} className="space-y-2">
                <Link
                  href={`/instructor/courses/${course.courseId}?tab=gradebook`}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  {course.code} {course.name}
                </Link>
                <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                  {course.atRiskStudents.map((student) => (
                    <li
                      key={student.studentProfileId}
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="text-muted-foreground">{student.studentCode}</span>{' '}
                        <span className="text-primary">{student.fullName}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatSemesterLabel(student.semesterTerm, student.academicYear)}
                        </span>
                        <Badge tone={RISK_LEVEL_TONES[student.riskLevel]}>
                          {RISK_LEVEL_LABELS[student.riskLevel]}
                        </Badge>
                        <Badge tone={gradeBadgeTone(student.grade)}>
                          {GRADE_LABELS[student.grade]}
                        </Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
