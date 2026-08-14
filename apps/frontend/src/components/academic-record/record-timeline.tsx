'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CourseListItem, Grade, SemesterGpa, StudentCourseRecord } from '@eduanalyze-ai/shared-types';
import { deleteCourseRecord, updateCourseRecordGrade } from '@/lib/api/academic-record';
import { GRADE_LABELS, GRADE_OPTIONS } from '@/lib/grade-label';
import { gradeBadgeClassName } from '@/lib/grade-badge-color';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SemesterGroupHeader } from './semester-group-header';

interface SemesterGroup {
  id: string;
  label: string;
}

interface RetakeInfo {
  isLatest: boolean;
  previousGrade?: Grade;
}

export function RecordTimeline({
  records,
  courseMap,
  semesters,
  gpaBySemester,
  highlightRecordId,
  onChanged,
}: {
  records: StudentCourseRecord[];
  courseMap: Map<string, CourseListItem>;
  // Already sorted newest-first — same order used by the GPA trend chart
  // and the add-record form's semester dropdown.
  semesters: SemesterGroup[];
  gpaBySemester: SemesterGpa[];
  // Record to flash green briefly (just created) — parent owns the timer
  // that clears this back to null.
  highlightRecordId?: string | null;
  onChanged: () => void;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Set while a row plays its exit animation, before the delete call
  // actually fires — see the effect below.
  const [exitingRecordId, setExitingRecordId] = useState<string | null>(null);

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

  // Default-expanded: only the most recent semester with records — the
  // rest start collapsed so the page isn't a wall of past terms on load.
  const [expandedSemesterIds, setExpandedSemesterIds] = useState<Set<string>>(
    () => new Set(semestersWithRecords[0] ? [semestersWithRecords[0].id] : []),
  );

  function toggleSemester(semesterId: string) {
    setExpandedSemesterIds((prev) => {
      const next = new Set(prev);
      if (next.has(semesterId)) next.delete(semesterId);
      else next.add(semesterId);
      return next;
    });
  }

  // If the just-created record landed in a semester that's still
  // collapsed (anything other than the most recent term), force it open
  // — otherwise the highlight flash would happen on a hidden row and the
  // user would never see it.
  useEffect(() => {
    if (!highlightRecordId) return;
    const record = records.find((r) => r.id === highlightRecordId);
    if (!record) return;
    setExpandedSemesterIds((prev) => {
      if (prev.has(record.semesterId)) return prev;
      const next = new Set(prev);
      next.add(record.semesterId);
      return next;
    });
  }, [highlightRecordId, records]);

  // Retake detection — no backend field for this; a retake is simply a
  // courseId appearing in more than one record (the unique constraint is
  // (studentProfileId, courseId, semesterId), so both the original and
  // the retake attempt stay isActive:true side by side). semesters is
  // already sorted newest-first, so its index doubles as recency rank.
  const semesterIndexById = new Map(semesters.map((s, i) => [s.id, i]));
  const recordsByCourseId = new Map<string, StudentCourseRecord[]>();
  for (const record of records) {
    const group = recordsByCourseId.get(record.courseId) ?? [];
    group.push(record);
    recordsByCourseId.set(record.courseId, group);
  }
  const retakeInfoByRecordId = new Map<string, RetakeInfo>();
  for (const group of recordsByCourseId.values()) {
    if (group.length < 2) continue;
    const sorted = [...group].sort(
      (a, b) => (semesterIndexById.get(a.semesterId) ?? 0) - (semesterIndexById.get(b.semesterId) ?? 0),
    );
    sorted.forEach((record, i) => {
      retakeInfoByRecordId.set(record.id, {
        isLatest: i === 0,
        previousGrade: i === 0 ? sorted[1]?.grade : undefined,
      });
    });
  }

  async function handleGradeChange(id: string, grade: string) {
    setBusyId(id);
    try {
      await updateCourseRecordGrade(id, { grade: grade as StudentCourseRecord['grade'] });
      onChanged();
    } finally {
      setBusyId(null);
    }
  }

  function handleDelete(id: string) {
    // Play the exit animation first — the actual delete + onChanged()
    // (which invalidates the query and would otherwise make the row
    // vanish instantly) happens after the animation finishes, in the
    // effect below.
    setConfirmingId(null);
    setExitingRecordId(id);
  }

  useEffect(() => {
    if (!exitingRecordId) return;
    const id = exitingRecordId;
    // Matches duration-500 above — the row's slide/fade-out class.
    const timer = setTimeout(async () => {
      setBusyId(id);
      try {
        await deleteCourseRecord(id);
        onChanged();
      } finally {
        setBusyId(null);
        setExitingRecordId(null);
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitingRecordId]);

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
          {semestersWithRecords.map((semester, index) => {
            const semesterRecords = recordsBySemesterId.get(semester.id) ?? [];
            const semesterGpa = gpaBySemesterId.get(semester.id);
            const isExpanded = expandedSemesterIds.has(semester.id);

            // "Previous" = chronologically earlier = further along this
            // newest-first array (index+1, not index-1). Walk past any
            // term whose gpa is null (WISU-only, nothing to compare)
            // instead of stopping there, so a single gap-term doesn't
            // hide a real comparison against the term before it.
            let previousGpa: number | null = null;
            for (let i = index + 1; i < semestersWithRecords.length; i++) {
              const candidate = gpaBySemesterId.get(semestersWithRecords[i].id)?.gpa;
              if (candidate != null) {
                previousGpa = candidate;
                break;
              }
            }

            return (
              <div key={semester.id} className="relative border-l-2 border-slate-100 pl-6">
                <span className="absolute -left-[7px] top-0 h-3 w-3 rounded-full border-2 border-primary bg-white" />

                <SemesterGroupHeader
                  label={semester.label}
                  gpa={semesterGpa?.gpa ?? null}
                  previousGpa={previousGpa}
                  creditsCounted={semesterGpa?.creditsCounted ?? 0}
                  isExpanded={isExpanded}
                  onToggle={() => toggleSemester(semester.id)}
                />

                {isExpanded && (
                  <div className="space-y-2">
                    {semesterRecords.map((record) => {
                      const course = courseMap.get(record.courseId);
                      const isBusy = busyId === record.id;
                      const retake = retakeInfoByRecordId.get(record.id);
                      const isExiting = exitingRecordId === record.id;
                      const isHighlighted = highlightRecordId === record.id;

                      return (
                        <div
                          key={record.id}
                          className={cn(
                            'flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3 transition-colors duration-500',
                            isExiting && 'animate-out fade-out-0 slide-out-to-top-4 duration-500',
                            isHighlighted && 'bg-emerald-50',
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-primary">
                              {course?.code ?? '—'} — {course?.name ?? '—'}
                            </p>
                            <p className="text-xs text-muted-foreground">{record.credits} หน่วยกิต</p>
                            {retake?.isLatest && retake.previousGrade && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                เกรดเดิม{' '}
                                <span className="line-through">{GRADE_LABELS[retake.previousGrade]}</span>
                                {' → '}
                                {GRADE_LABELS[record.grade]}
                              </p>
                            )}
                          </div>

                          {retake && (
                            <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                              ลงซ้ำ
                            </span>
                          )}

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
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
