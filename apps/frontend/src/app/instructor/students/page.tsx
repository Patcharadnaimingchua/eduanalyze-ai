'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
import { PageHeader } from '@/components/layout/page-header';
import { Reveal } from '@/components/layout/reveal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortHeader } from '@/components/ui/sort-header';
import { Skeleton, TableSkeleton } from '@/components/ui/skeleton';

const ALL_COURSES = 'ALL';
const ALL_RISK_LEVELS = 'ALL';

export default function InstructorStudentsPage() {
  return (
    <ProtectedRoute>
      {/* useSearchParams requires a Suspense boundary in the App Router */}
      <Suspense fallback={null}>
        <InstructorStudentsContent />
      </Suspense>
    </ProtectedRoute>
  );
}

// ?risk= (same name as the staff list) pre-selects the risk filter once, so the
// dashboard can link straight to e.g. the critical students. Anything else
// falls back to all levels; the backend still scopes and validates the query.
function riskFilterFromUrl(value: string | null): RiskLevel | typeof ALL_RISK_LEVELS {
  return RISK_LEVEL_ORDER.includes(value as RiskLevel) ? (value as RiskLevel) : ALL_RISK_LEVELS;
}

function InstructorStudentsContent() {
  const { user } = useAuth();
  const isInstructor = !!user?.roles.includes('INSTRUCTOR');
  const [courseId, setCourseId] = useState<string>(ALL_COURSES);
  const searchParams = useSearchParams();
  const [riskFilter, setRiskFilter] = useState<RiskLevel | typeof ALL_RISK_LEVELS>(() =>
    riskFilterFromUrl(searchParams.get('risk')),
  );
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: ['instructor-students', courseId, riskFilter],
    queryFn: () =>
      fetchInstructorStudents({
        courseId: courseId === ALL_COURSES ? undefined : courseId,
        riskLevel: riskFilter === ALL_RISK_LEVELS ? undefined : riskFilter,
      }),
    enabled: isInstructor,
  });

  const allStudents = useMemo(() => query.data?.students ?? [], [query.data]);
  const students = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term === '') return allStudents;
    return allStudents.filter(
      (s) =>
        s.studentCode.toLowerCase().includes(term) || s.fullName.toLowerCase().includes(term),
    );
  }, [allStudents, search]);
  const sort = useTableSort(students, {
    studentCode: (s) => s.studentCode,
    fullName: (s) => s.fullName,
    course: (s) => s.courseCode,
  });
  const pagination = usePagination(
    sort.sorted,
    undefined,
    `${courseId}|${riskFilter}|${search}|${sort.sortKey}|${sort.direction}`,
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
        <Reveal index={0}>
          <PageHeader
            title="นักศึกษา"
            description="ค้นหา/กรองนักศึกษาข้ามทุกวิชาที่คุณสอน ตามวิชาและระดับความเสี่ยง"
          />
        </Reveal>

        <Reveal index={1}>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="ค้นหารหัสนักศึกษาหรือชื่อ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 max-w-xs"
            />
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
            {(search.trim() !== '' || courseId !== ALL_COURSES || riskFilter !== ALL_RISK_LEVELS) && (
              <span className="text-sm text-muted-foreground">
                แสดง {students.length} จาก {allStudents.length} คน
              </span>
            )}
          </div>
        </Reveal>

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
          <Reveal index={2}>
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
                        <td className="py-2 pr-4">
                          <Link
                            href={`/instructor/courses/${s.courseId}?tab=gradebook&student=${s.studentProfileId}`}
                            className="text-primary hover:underline"
                          >
                            {s.fullName}
                          </Link>
                        </td>
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
          </Reveal>
        )}
      </DashboardShell>
    </RequireRole>
  );
}
