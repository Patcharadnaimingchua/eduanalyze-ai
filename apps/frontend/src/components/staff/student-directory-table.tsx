'use client';

import Link from 'next/link';
import type {
  CurriculumListItem,
  ProgramListItem,
  StaffStudentRiskEntry,
} from '@eduanalyze-ai/shared-types';
import { usePagination } from '@/lib/use-pagination';
import { useTableSort } from '@/lib/use-table-sort';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { SortHeader } from '@/components/ui/sort-header';
import { readStudentRisk, STAFF_RISK_ORDER } from './student-reading';

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

  const sort = useTableSort(students, {
    fullName: (s) => s.fullName,
    studentCode: (s) => s.studentCode,
    program: (s) => programMap.get(s.programId)?.name,
    admissionYear: (s) => s.admissionYear,
    gpa: (s) => s.gpa,
    risk: (s) => STAFF_RISK_ORDER.indexOf(readStudentRisk(s).key),
    status: (s) => (s.isActive ? 0 : 1),
  });
  // The parent re-derives `students` whenever its search/risk filter
  // changes, so the array identity is the signal to go back to page 1.
  const pagination = usePagination(
    sort.sorted,
    undefined,
    `${students.length}|${students[0]?.studentProfileId ?? ''}|${sort.sortKey}|${sort.direction}`,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>ทำเนียบนักศึกษา</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-muted-foreground">
                <SortHeader {...sort.sortProps('fullName')}>ชื่อ-นามสกุล</SortHeader>
                <SortHeader {...sort.sortProps('studentCode')}>รหัสนักศึกษา</SortHeader>
                <SortHeader {...sort.sortProps('program')}>สาขา</SortHeader>
                <th className="py-2 pr-4 font-medium">ฉบับหลักสูตร</th>
                <SortHeader {...sort.sortProps('admissionYear')}>ปีเข้าศึกษา</SortHeader>
                <SortHeader {...sort.sortProps('gpa')}>GPA</SortHeader>
                <SortHeader {...sort.sortProps('risk')}>ความเสี่ยง</SortHeader>
                <SortHeader {...sort.sortProps('status')}>สถานะ</SortHeader>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-muted-foreground">
                    ไม่พบนักศึกษาที่ตรงกับเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
              {pagination.pageRows.map((student) => {
                const program = programMap.get(student.programId);
                const curriculum = curriculumMap.get(student.curriculumId);
                const risk = readStudentRisk(student);
                return (
                  <tr
                    key={student.studentProfileId}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="py-3 pr-4">
                      {/* A suspended student's detail page answers 404, so the
                          name is plain text with a tag instead of a dead link. */}
                      {student.isActive ? (
                        <Link
                          href={`/staff/students/${student.studentProfileId}`}
                          className="text-primary hover:underline"
                        >
                          {student.fullName}
                        </Link>
                      ) : (
                        <span className="inline-flex flex-wrap items-center gap-2 text-muted-foreground">
                          {student.fullName}
                          <Badge tone="neutral">ระงับ</Badge>
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{student.studentCode}</td>
                    <td className="py-3 pr-4">{program?.name ?? '—'}</td>
                    <td className="py-3 pr-4">{curriculum?.version ?? '—'}</td>
                    <td className="py-3 pr-4">{student.admissionYear}</td>
                    <td className="py-3 pr-4">
                      {student.gpa === null ? '—' : student.gpa.toFixed(2)}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={risk.tone}>{risk.label}</Badge>
                      {student.atRiskCourseCount > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {student.atRiskCourseCount} วิชา
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={student.isActive ? 'success' : 'neutral'}>
                        {student.isActive ? 'ใช้งานอยู่' : 'ระงับการใช้งาน'}
                      </Badge>
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
