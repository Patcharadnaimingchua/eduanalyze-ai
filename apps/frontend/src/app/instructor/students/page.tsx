'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { RiskLevel } from '@eduanalyze-ai/shared-types';
import { fetchInstructorStudents } from '@/lib/api/instructor';
import { GRADE_LABELS } from '@/lib/grade-label';
import { gradeBadgeTone } from '@/lib/grade-badge-color';
import { RISK_LEVEL_LABELS, RISK_LEVEL_ORDER, RISK_LEVEL_TONES } from '@/lib/risk-level';
import { usePagination } from '@/lib/use-pagination';
import { useTableSort } from '@/lib/use-table-sort';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortHeader } from '@/components/ui/sort-header';
import { Skeleton, TableSkeleton } from '@/components/ui/skeleton';

const ALL_COURSES = 'ALL';
const ALL_RISK_LEVELS = 'ALL';

export default function InstructorStudentsPage() {
  return (
    <ProtectedRoute>
      <InstructorStudentsContent />
    </ProtectedRoute>
  );
}

function InstructorStudentsContent() {
  const { user } = useAuth();
  const isInstructor = !!user?.roles.includes('INSTRUCTOR');
  const [courseId, setCourseId] = useState<string>(ALL_COURSES);
  const [riskFilter, setRiskFilter] = useState<RiskLevel | typeof ALL_RISK_LEVELS>(
    ALL_RISK_LEVELS,
  );

  const query = useQuery({
    queryKey: ['instructor-students', courseId, riskFilter],
    queryFn: () =>
      fetchInstructorStudents({
        courseId: courseId === ALL_COURSES ? undefined : courseId,
        riskLevel: riskFilter === ALL_RISK_LEVELS ? undefined : riskFilter,
      }),
    enabled: isInstructor,
  });

  const students = query.data?.students ?? [];
  const sort = useTableSort(students, {
    studentCode: (s) => s.studentCode,
    fullName: (s) => s.fullName,
    course: (s) => s.courseCode,
  });
  const pagination = usePagination(
    sort.sorted,
    undefined,
    `${courseId}|${riskFilter}|${sort.sortKey}|${sort.direction}`,
  );

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-3">
          <Skeleton className="mx-auto h-10 w-10 rounded-full" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  return (
    <RequireRole role="INSTRUCTOR">
      <DashboardShell role="INSTRUCTOR" identityLabel={user.email} fullName={user.fullName}>
        <div>
          <h1 className="text-2xl font-semibold text-primary">นักศึกษา</h1>
          <p className="text-sm text-muted-foreground">
            ค้นหา/กรองนักศึกษาข้ามทุกวิชาที่คุณสอน ตามวิชาและระดับความเสี่ยง
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="h-9 w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_COURSES}>ทุกวิชา</SelectItem>
              {(query.data?.courses ?? []).map((c) => (
                <SelectItem key={c.courseId} value={c.courseId}>
                  {c.code} — {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={riskFilter}
            onValueChange={(value) => setRiskFilter(value as RiskLevel | typeof ALL_RISK_LEVELS)}
          >
            <SelectTrigger className="h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_RISK_LEVELS}>ทุกระดับ</SelectItem>
              {RISK_LEVEL_ORDER.map((level) => (
                <SelectItem key={level} value={level}>
                  {RISK_LEVEL_LABELS[level]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {query.isLoading && <TableSkeleton cols={5} rows={4} />}

        {query.isError && (
          <Alert variant="destructive">
            <AlertDescription>ไม่สามารถโหลดข้อมูลนักศึกษาได้ กรุณาลองใหม่อีกครั้ง</AlertDescription>
          </Alert>
        )}

        {query.data && students.length === 0 && (
          <Alert>
            <AlertDescription>ไม่พบนักศึกษาที่ตรงกับเงื่อนไขที่เลือก</AlertDescription>
          </Alert>
        )}

        {query.data && students.length > 0 && (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-muted-foreground">
                    <SortHeader {...sort.sortProps('studentCode')}>รหัสนักศึกษา</SortHeader>
                    <SortHeader {...sort.sortProps('fullName')}>ชื่อ-นามสกุล</SortHeader>
                    <SortHeader {...sort.sortProps('course')}>วิชา</SortHeader>
                    <th className="py-2 font-medium">เกรด</th>
                    <th className="py-2 font-medium">ความเสี่ยง</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.pageRows.map((s) => (
                    <tr
                      key={`${s.studentProfileId}-${s.courseId}`}
                      className="border-b border-slate-50 hover:bg-slate-50"
                    >
                      <td className="py-2 pr-4 text-muted-foreground">{s.studentCode}</td>
                      <td className="py-2 pr-4 text-primary">{s.fullName}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{s.courseCode}</td>
                      <td className="py-2 pr-4">
                        <Badge tone={gradeBadgeTone(s.grade)}>{GRADE_LABELS[s.grade]}</Badge>
                      </td>
                      <td className="py-2 pr-4">
                        <Badge tone={RISK_LEVEL_TONES[s.riskLevel]}>
                          {RISK_LEVEL_LABELS[s.riskLevel]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...pagination} onPageChange={pagination.setPage} />
          </div>
        )}
      </DashboardShell>
    </RequireRole>
  );
}
