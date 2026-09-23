'use client';

import { useEffect, useState } from 'react';
import type { CourseListItem, StudentCourseRecord } from '@eduanalyze-ai/shared-types';
import { deleteCourseRecord, updateCourseRecordGrade } from '@/lib/api/academic-record';
import { GRADE_LABELS, GRADE_OPTIONS } from '@/lib/grade-label';
import { useToast } from '@/lib/toast-context';
import { usePagination } from '@/lib/use-pagination';
import { useTableSort } from '@/lib/use-table-sort';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortHeader } from '@/components/ui/sort-header';

interface SemesterLabel {
  label: string;
}

// The staff-side view of what students see as a timeline in
// components/academic-record/record-timeline.tsx, minus the "ประเมินวิชานี้"
// self-assessment link — that action belongs to the student themselves, not
// staff acting on their behalf. updateCourseRecordGrade/deleteCourseRecord
// are role-agnostic (@Roles includes STAFF on both routes already) so reused
// as-is.
export function StaffRecordTable({
  records,
  courseMap,
  semesterMap,
  onChanged,
}: {
  records: StudentCourseRecord[];
  courseMap: Map<string, CourseListItem>;
  semesterMap: Map<string, SemesterLabel>;
  onChanged: () => void;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();

  const sort = useTableSort(records, {
    code: (r) => courseMap.get(r.courseId)?.code,
    name: (r) => courseMap.get(r.courseId)?.name,
    credits: (r) => r.credits,
    semester: (r) => semesterMap.get(r.semesterId)?.label,
    grade: (r) => GRADE_OPTIONS.indexOf(r.grade),
  });
  const pagination = usePagination(
    sort.sorted,
    undefined,
    `${records.length}|${records[0]?.id ?? ''}|${sort.sortKey}|${sort.direction}`,
  );

  // A row left awaiting delete-confirmation must not stay armed once it
  // has scrolled to another page or moved under a re-sort.
  useEffect(() => {
    setConfirmingId(null);
  }, [pagination.page, sort.sortKey, sort.direction]);

  async function handleGradeChange(id: string, grade: string) {
    setBusyId(id);
    try {
      await updateCourseRecordGrade(id, { grade: grade as StudentCourseRecord['grade'] });
      onChanged();
      toast.success('บันทึกเกรดแล้ว');
    } catch {
      toast.error('บันทึกเกรดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
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
      toast.success('ลบรายวิชาแล้ว');
    } catch {
      toast.error('ลบรายวิชาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>รายวิชาที่บันทึกไว้</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-muted-foreground">
                <SortHeader {...sort.sortProps('code')}>รหัสวิชา</SortHeader>
                <SortHeader {...sort.sortProps('name')}>ชื่อวิชา</SortHeader>
                <SortHeader {...sort.sortProps('credits')}>หน่วยกิต</SortHeader>
                <SortHeader {...sort.sortProps('semester')}>ภาคเรียน</SortHeader>
                <SortHeader {...sort.sortProps('grade')}>เกรด</SortHeader>
                <th className="py-2 pr-0 font-medium">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    ยังไม่มีรายวิชาที่บันทึกไว้
                  </td>
                </tr>
              )}
              {pagination.pageRows.map((record) => {
                const course = courseMap.get(record.courseId);
                const semester = semesterMap.get(record.semesterId);
                const isBusy = busyId === record.id;

                return (
                  <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 pr-4 text-primary">{course?.code ?? '—'}</td>
                    <td className="py-3 pr-4">{course?.name ?? '—'}</td>
                    <td className="py-3 pr-4">{record.credits}</td>
                    <td className="py-3 pr-4">{semester?.label ?? '—'}</td>
                    <td className="py-3 pr-4">
                      <Select
                        value={record.grade}
                        onValueChange={(value) => handleGradeChange(record.id, value)}
                        disabled={isBusy}
                      >
                        <SelectTrigger className="h-8 w-24">
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
                    </td>
                    <td className="py-3 pr-0">
                      {confirmingId === record.id ? (
                        <div className="flex gap-2">
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmingId(record.id)}
                        >
                          ลบ
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination {...pagination} onPageChange={pagination.setPage} />
      </CardContent>
    </Card>
  );
}
