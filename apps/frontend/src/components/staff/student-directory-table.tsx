'use client';

import Link from 'next/link';
import type {
  CurriculumListItem,
  ProgramListItem,
  StaffStudentRiskEntry,
} from '@eduanalyze-ai/shared-types';
import { RISK_LEVEL_LABELS, RISK_LEVEL_TONES } from '@/lib/risk-level';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StudentDirectoryTable({
  students,
  programs,
  curricula,
}: {
  students: StaffStudentRiskEntry[];
  programs: ProgramListItem[];
  curricula: CurriculumListItem[];
}) {
  const programMap = new Map(programs.map((p) => [p.id, p]));
  const curriculumMap = new Map(curricula.map((c) => [c.id, c]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ทำเนียบนักศึกษา</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-muted-foreground">
                <th className="py-2 pr-4 font-medium">ชื่อ-นามสกุล</th>
                <th className="py-2 pr-4 font-medium">รหัสนักศึกษา</th>
                <th className="py-2 pr-4 font-medium">สาขา</th>
                <th className="py-2 pr-4 font-medium">ฉบับหลักสูตร</th>
                <th className="py-2 pr-4 font-medium">ปีเข้าศึกษา</th>
                <th className="py-2 pr-4 font-medium">GPA</th>
                <th className="py-2 pr-4 font-medium">ความเสี่ยง</th>
                <th className="py-2 pr-4 font-medium">สถานะ</th>
                <th className="py-2 pr-0 font-medium" />
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-muted-foreground">
                    ไม่พบนักศึกษาที่ตรงกับเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
              {students.map((student) => {
                const program = programMap.get(student.programId);
                const curriculum = curriculumMap.get(student.curriculumId);
                return (
                  <tr key={student.studentProfileId} className="border-b border-slate-50">
                    <td className="py-3 pr-4 text-primary">{student.fullName}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{student.studentCode}</td>
                    <td className="py-3 pr-4">{program?.name ?? '—'}</td>
                    <td className="py-3 pr-4">{curriculum?.version ?? '—'}</td>
                    <td className="py-3 pr-4">{student.admissionYear}</td>
                    <td className="py-3 pr-4">
                      {student.gpa === null ? '—' : student.gpa.toFixed(2)}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={RISK_LEVEL_TONES[student.riskLevel]}>
                        {RISK_LEVEL_LABELS[student.riskLevel]}
                      </Badge>
                      {student.atRiskCourseCount > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {student.atRiskCourseCount} วิชา
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={student.isActive ? 'green' : 'gray'}>
                        {student.isActive ? 'ใช้งานอยู่' : 'ระงับการใช้งาน'}
                      </Badge>
                    </td>
                    <td className="py-3 pr-0 text-right">
                      <Link
                        href={`/staff/students/${student.studentProfileId}`}
                        className="text-sm font-medium text-brand hover:underline"
                      >
                        ดูรายละเอียด
                      </Link>
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
