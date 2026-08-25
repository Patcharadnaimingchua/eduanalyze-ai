'use client';

import type { StudentRosterEntry } from '@eduanalyze-ai/shared-types';
import { gradeBadgeTone } from '@/lib/grade-badge-color';
import { GRADE_LABELS } from '@/lib/grade-label';
import { Badge } from '@/components/ui/badge';

export function StudentRosterTable({
  roster,
  isLoading,
  isError,
}: {
  roster: StudentRosterEntry[] | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs text-muted-foreground">
            <th className="py-2 pr-4 font-medium">รหัสนักศึกษา</th>
            <th className="py-2 pr-4 font-medium">ชื่อ-นามสกุล</th>
            <th className="py-2 font-medium">เกรด</th>
          </tr>
        </thead>
        <tbody>
          {roster.map((student) => (
            <tr key={student.studentProfileId} className="border-b border-slate-50">
              <td className="py-2 pr-4 text-muted-foreground">{student.studentCode}</td>
              <td className="py-2 pr-4 text-primary">{student.fullName}</td>
              <td className="py-2">
                <Badge tone={gradeBadgeTone(student.grade)}>{GRADE_LABELS[student.grade]}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
