'use client';

import { useState } from 'react';
import { isAxiosError } from 'axios';
import { Download } from 'lucide-react';
import type { Grade, StudentRosterEntry } from '@eduanalyze-ai/shared-types';
import { deleteCourseRecord, updateCourseRecordGrade } from '@/lib/api/academic-record';
import { gradeBadgeTone } from '@/lib/grade-badge-color';
import { GRADE_LABELS, GRADE_OPTIONS } from '@/lib/grade-label';
import { downloadCsv, toCsv } from '@/lib/csv';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StudentTimelineCard } from './student-timeline-card';

function exportRosterCsv(
  courseCode: string,
  roster: StudentRosterEntry[],
  atRiskStudentIds: Set<string>,
) {
  const csv = toCsv(
    ['รหัสนักศึกษา', 'ชื่อ-นามสกุล', 'เกรด', 'สถานะเสี่ยง'],
    roster.map((student) => [
      student.studentCode,
      student.fullName,
      GRADE_LABELS[student.grade],
      atRiskStudentIds.has(student.studentProfileId) ? 'เสี่ยง' : '',
    ]),
  );
  const today = new Date().toISOString().slice(0, 10);
  downloadCsv(`gradebook-${courseCode}-${today}.csv`, csv);
}

function describeWriteError(error: unknown) {
  if (isAxiosError(error)) {
    if (error.response?.status === 403) return 'คุณไม่มีสิทธิ์แก้ไขผลการเรียนของรายวิชานี้';
    if (error.response?.status === 404) return 'ไม่พบรายการนี้แล้ว อาจถูกลบไปก่อนหน้า';
  }
  return 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
}

// Read-only when onChanged is omitted. Rows are each student's latest
// attempt only, so removing one can surface an earlier attempt in its place.
export function StudentRosterTable({
  courseId,
  courseCode,
  roster,
  isLoading,
  isError,
  atRiskStudentIds,
  onChanged,
}: {
  courseId: string;
  courseCode: string;
  roster: StudentRosterEntry[] | undefined;
  isLoading: boolean;
  isError: boolean;
  atRiskStudentIds: Set<string>;
  onChanged?: () => void;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const editable = !!onChanged;

  async function runWrite(recordId: string, action: () => Promise<unknown>) {
    setBusyId(recordId);
    setWriteError(null);
    try {
      await action();
      setConfirmingId(null);
      onChanged?.();
    } catch (error) {
      setWriteError(describeWriteError(error));
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">กำลังโหลดรายชื่อนักศึกษา...</p>;
  }
  if (isError || !roster) {
    return <p className="text-sm text-destructive">ไม่สามารถโหลดรายชื่อนักศึกษาได้</p>;
  }
  if (roster.length === 0) {
    return <p className="text-sm text-muted-foreground">ยังไม่มีนักศึกษาลงทะเบียนในรายวิชานี้</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        {editable ? (
          <p className="text-xs text-muted-foreground">
            นักศึกษาเป็นผู้บันทึกผลการเรียนเอง — ใช้หน้านี้เพื่อแก้ไขกรณีเกรดผิดเท่านั้น
            แสดงเฉพาะผลการเรียนครั้งล่าสุดของแต่ละคน
          </p>
        ) : (
          <div />
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => exportRosterCsv(courseCode, roster, atRiskStudentIds)}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          ส่งออก CSV
        </Button>
      </div>
      {writeError && <p className="text-sm text-destructive">{writeError}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-muted-foreground">
              <th className="py-2 pr-4 font-medium">รหัสนักศึกษา</th>
              <th className="py-2 pr-4 font-medium">ชื่อ-นามสกุล</th>
              <th className="py-2 pr-4 font-medium">เกรด</th>
              {editable && <th className="py-2 font-medium">การจัดการ</th>}
            </tr>
          </thead>
          <tbody>
            {roster.map((student) => {
              const recordId = student.studentCourseRecordId;
              const isBusy = busyId === recordId;

              return (
                <tr key={student.studentProfileId} className="border-b border-slate-50">
                  <td className="py-2 pr-4 text-muted-foreground">{student.studentCode}</td>
                  <td className="py-2 pr-4">
                    <button
                      type="button"
                      onClick={() => setSelectedStudentId(student.studentProfileId)}
                      className="text-primary hover:underline"
                    >
                      {student.fullName}
                    </button>
                  </td>
                  <td className="py-2 pr-4">
                    {editable ? (
                      <Select
                        value={student.grade}
                        onValueChange={(value) =>
                          runWrite(recordId, () =>
                            updateCourseRecordGrade(recordId, { grade: value as Grade }),
                          )
                        }
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
                    ) : (
                      <Badge tone={gradeBadgeTone(student.grade)}>{GRADE_LABELS[student.grade]}</Badge>
                    )}
                  </td>
                  {editable && (
                    <td className="py-2">
                      {confirmingId === recordId ? (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => runWrite(recordId, () => deleteCourseRecord(recordId))}
                          >
                            ยืนยันลบ
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
                          disabled={isBusy}
                          onClick={() => setConfirmingId(recordId)}
                        >
                          ลบ
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selectedStudentId && (
        <StudentTimelineCard
          courseId={courseId}
          studentProfileId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </div>
  );
}
