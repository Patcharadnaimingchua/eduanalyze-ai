'use client';

import { AlertTriangle } from 'lucide-react';
import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { gradeBadgeTone } from '@/lib/grade-badge-color';
import { GRADE_LABELS, formatSemesterLabel } from '@/lib/grade-label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AtRiskStudentsCard({
  courses,
  onOpenGradebook,
}: {
  courses: InstructorCourseSummary[];
  onOpenGradebook: (courseId: string) => void;
}) {
  const coursesWithRisk = courses.filter((c) => c.atRiskStudents.length > 0);
  const total = coursesWithRisk.reduce((sum, c) => sum + c.atRiskStudents.length, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          นักศึกษากลุ่มเสี่ยง
          {total > 0 && <Badge tone="red">{total}</Badge>}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          ผลการเรียนครั้งล่าสุดได้เกรด C ลงมา (C, D+, D, F, U) — ประเมินจากเกรดรายวิชา
          ไม่ใช่ผลประเมิน CLO รายบุคคล
        </p>
      </CardHeader>
      <CardContent>
        {coursesWithRisk.length === 0 ? (
          <p className="text-sm text-muted-foreground">ไม่มีนักศึกษาที่อยู่ในกลุ่มเสี่ยง</p>
        ) : (
          <div className="space-y-4">
            {coursesWithRisk.map((course) => (
              <div key={course.courseId} className="space-y-2">
                <button
                  type="button"
                  onClick={() => onOpenGradebook(course.courseId)}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  {course.code} {course.name}
                </button>
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
