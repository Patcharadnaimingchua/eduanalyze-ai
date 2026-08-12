'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CourseListItem, SemesterGpa, StudentCourseRecord } from '@eduanalyze-ai/shared-types';
import { deleteCourseRecord, updateCourseRecordGrade } from '@/lib/api/academic-record';
import { GRADE_LABELS, GRADE_OPTIONS } from '@/lib/grade-label';
import { gradeBadgeClassName } from '@/lib/grade-badge-color';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SemesterGroup {
  id: string;
  label: string;
}

export function RecordTimeline({
  records,
  courseMap,
  semesters,
  gpaBySemester,
  onChanged,
}: {
  records: StudentCourseRecord[];
  courseMap: Map<string, CourseListItem>;
  // Already sorted newest-first — same order used by the GPA trend chart
  // and the add-record form's semester dropdown.
  semesters: SemesterGroup[];
  gpaBySemester: SemesterGpa[];
  onChanged: () => void;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const gpaBySemesterId = new Map(gpaBySemester.map((s) => [s.semesterId, s]));
  const recordsBySemesterId = new Map<string, StudentCourseRecord[]>();
  for (const record of records) {
    const group = recordsBySemesterId.get(record.semesterId) ?? [];
    group.push(record);
    recordsBySemesterId.set(record.semesterId, group);
  }

  // Only render semesters that actually have at least one record — the
  // dropdown's semester list includes future/empty terms too.
  const semestersWithRecords = semesters.filter((s) => recordsBySemesterId.has(s.id));

  async function handleGradeChange(id: string, grade: string) {
    setBusyId(id);
    try {
      await updateCourseRecordGrade(id, { grade: grade as StudentCourseRecord['grade'] });
      onChanged();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await deleteCourseRecord(id);
      setConfirmingId(null);
      onChanged();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">รายวิชาที่บันทึกไว้</CardTitle>
      </CardHeader>
      <CardContent>
        {semestersWithRecords.length === 0 && (
          <p className="py-6 text-center text-muted-foreground">ยังไม่มีรายวิชาที่บันทึกไว้</p>
        )}

        <div className="space-y-8">
          {semestersWithRecords.map((semester) => {
            const semesterRecords = recordsBySemesterId.get(semester.id) ?? [];
            const semesterGpa = gpaBySemesterId.get(semester.id);

            return (
              <div key={semester.id} className="relative border-l-2 border-slate-100 pl-6">
                <span className="absolute -left-[7px] top-0 h-3 w-3 rounded-full border-2 border-primary bg-white" />

                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-primary">{semester.label}</h3>
                  {semesterGpa?.gpa != null && (
                    <span className="text-xs text-muted-foreground">
                      เกรดเฉลี่ยเทอมนี้ {semesterGpa.gpa.toFixed(2)} ({semesterGpa.creditsCounted} หน่วยกิต)
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {semesterRecords.map((record) => {
                    const course = courseMap.get(record.courseId);
                    const isBusy = busyId === record.id;

                    return (
                      <div
                        key={record.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-primary">
                            {course?.code ?? '—'} — {course?.name ?? '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">{record.credits} หน่วยกิต</p>
                        </div>

                        <span
                          className={cn(
                            'shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium',
                            gradeBadgeClassName(record.grade),
                          )}
                        >
                          {GRADE_LABELS[record.grade]}
                        </span>

                        <Select
                          value={record.grade}
                          onValueChange={(value) => handleGradeChange(record.id, value)}
                          disabled={isBusy}
                        >
                          <SelectTrigger className="h-8 w-24 shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADE_OPTIONS.map((g) => (
                              <SelectItem key={g} value={g}>
                                {GRADE_LABELS[g]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {confirmingId === record.id ? (
                          <div className="flex shrink-0 gap-2">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleDelete(record.id)}
                            >
                              ยืนยัน
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => setConfirmingId(null)}
                            >
                              ยกเลิก
                            </Button>
                          </div>
                        ) : (
                          <div className="flex shrink-0 gap-2">
                            <Link href={`/course-assessment/${record.courseId}`}>
                              <Button type="button" variant="outline" size="sm">
                                ประเมินวิชานี้
                              </Button>
                            </Link>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmingId(record.id)}
                            >
                              ลบ
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
