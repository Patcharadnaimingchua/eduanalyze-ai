'use client';

import { useState } from 'react';
import type { CourseListItem, StudentCourseRecord } from '@eduanalyze-ai/shared-types';
import { deleteCourseRecord, updateCourseRecordGrade } from '@/lib/api/academic-record';
import { GRADE_LABELS, GRADE_OPTIONS } from '@/lib/grade-label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SemesterLabel {
  label: string;
}

// Same shape as components/academic-record/record-table.tsx (STUDENT
// self-service), minus the "ประเมินวิชานี้" self-assessment link — that
// action belongs to the student themselves, not staff acting on their
// behalf. updateCourseRecordGrade/deleteCourseRecord are role-agnostic
// (@Roles includes STAFF on both routes already) so reused as-is.
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-muted-foreground">
                <th className="py-2 pr-4 font-medium">รหัสวิชา</th>
                <th className="py-2 pr-4 font-medium">ชื่อวิชา</th>
                <th className="py-2 pr-4 font-medium">หน่วยกิต</th>
                <th className="py-2 pr-4 font-medium">ภาคเรียน</th>
                <th className="py-2 pr-4 font-medium">เกรด</th>
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
              {records.map((record) => {
                const course = courseMap.get(record.courseId);
                const semester = semesterMap.get(record.semesterId);
                const isBusy = busyId === record.id;

                return (
                  <tr key={record.id} className="border-b border-slate-50">
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
      </CardContent>
    </Card>
  );
}
