'use client';

import { Suspense, useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchStaffStudentRisk } from '@/lib/api/staff';
import { fetchCurricula, fetchPrograms } from '@/lib/api/organization';
import { useAuth } from '@/lib/auth-context';
import { RISK_LEVEL_LABELS } from '@/lib/risk-level';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { PageLoadError } from '@/components/layout/page-states';
import { Reveal } from '@/components/layout/reveal';
import { StudentDirectoryTable } from '@/components/staff/student-directory-table';
import {
  NO_DATA_LABEL,
  readStudentRisk,
  STAFF_RISK_ORDER,
  type StaffRiskKey,
} from '@/components/staff/student-reading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton, TableSkeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Radix reserves '' for "no selection", so the all-levels/programs/years
// option needs a sentinel of its own — same pattern the instructor
// gradebook uses for risk.
const ALL_RISK_LEVELS = 'ALL';
const ALL_PROGRAMS = 'ALL';
const ALL_YEARS = 'ALL';

export default function StaffStudentsPage() {
  return (
    <ProtectedRoute>
      <RequireRole role="STAFF">
        {/* useSearchParams requires a Suspense boundary in the App Router */}
        <Suspense fallback={<StaffStudentsSkeleton />}>
          <StaffStudentsContent />
        </Suspense>
      </RequireRole>
    </ProtectedRoute>
  );
}

function StaffStudentsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <TableSkeleton cols={6} rows={6} />
    </div>
  );
}

function StaffStudentsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filters live only in the URL (not useState) so a reload or a Back from
  // the student detail page lands on the same filtered view — the exact
  // gap M10 reported. router.replace, not push: filter changes should not
  // themselves pile up in browser history.
  const search = searchParams.get('q') ?? '';
  const riskFilter = (searchParams.get('risk') as StaffRiskKey | null) ?? ALL_RISK_LEVELS;
  const programFilter = searchParams.get('program') ?? ALL_PROGRAMS;
  const yearFilter = searchParams.get('year') ?? ALL_YEARS;

  const updateParams = useCallback(
    (changes: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === '') params.delete(key);
        else params.set(key, value);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const studentsQuery = useQuery({
    queryKey: ['staff-student-risk'],
    queryFn: fetchStaffStudentRisk,
  });
  const programsQuery = useQuery({ queryKey: ['programs'], queryFn: fetchPrograms });
  const curriculaQuery = useQuery({ queryKey: ['curricula'], queryFn: fetchCurricula });

  const allStudents = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);
  const admissionYears = useMemo(
    () => [...new Set(allStudents.map((s) => s.admissionYear))].sort((a, b) => b - a),
    [allStudents],
  );
  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allStudents.filter(
      (student) =>
        (riskFilter === ALL_RISK_LEVELS || readStudentRisk(student).key === riskFilter) &&
        (programFilter === ALL_PROGRAMS || student.programId === programFilter) &&
        (yearFilter === ALL_YEARS || student.admissionYear === Number(yearFilter)) &&
        (term === '' ||
          student.fullName.toLowerCase().includes(term) ||
          student.studentCode.toLowerCase().includes(term)),
    );
  }, [allStudents, search, riskFilter, programFilter, yearFilter]);
  const isFiltered =
    search.trim() !== '' ||
    riskFilter !== ALL_RISK_LEVELS ||
    programFilter !== ALL_PROGRAMS ||
    yearFilter !== ALL_YEARS;

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
    <DashboardShell role="STAFF" identityLabel={user.email} fullName={user.fullName}>
      <Reveal index={0}>
        <PageHeader title="ทำเนียบนักศึกษา" description="นักศึกษาในขอบเขตความรับผิดชอบของคุณ" />
      </Reveal>

      <Reveal index={1} className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="ค้นหาชื่อหรือรหัสนักศึกษา..."
          defaultValue={search}
          onChange={(e) => updateParams({ q: e.target.value })}
          className="max-w-sm"
        />
        <Select value={programFilter} onValueChange={(value) => updateParams({ program: value })}>
          <SelectTrigger className="h-9 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PROGRAMS}>ทุกสาขา</SelectItem>
            {(programsQuery.data ?? []).map((program) => (
              <SelectItem key={program.id} value={program.id}>
                {program.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={yearFilter} onValueChange={(value) => updateParams({ year: value })}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_YEARS}>ทุกปีเข้าศึกษา</SelectItem>
            {admissionYears.map((year) => (
              <SelectItem key={year} value={String(year)}>
                ปีเข้า {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={(value) => updateParams({ risk: value })}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_RISK_LEVELS}>ทุกระดับ</SelectItem>
            {STAFF_RISK_ORDER.map((level) => (
              <SelectItem key={level} value={level}>
                {level === 'NO_DATA' ? NO_DATA_LABEL : RISK_LEVEL_LABELS[level]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isFiltered && (
          <span className="text-sm text-muted-foreground">
            แสดง {filteredStudents.length} จาก {allStudents.length} คน
          </span>
        )}
      </Reveal>

      <Reveal index={2}>
        {studentsQuery.isLoading && (
          <Card>
            <CardHeader>
              <CardTitle>ทำเนียบนักศึกษา</CardTitle>
            </CardHeader>
            <CardContent>
              <TableSkeleton cols={6} rows={6} />
            </CardContent>
          </Card>
        )}
        {studentsQuery.isError && <PageLoadError onRetry={() => studentsQuery.refetch()} />}
        {studentsQuery.data && (
          <StudentDirectoryTable
            students={filteredStudents}
            programs={programsQuery.data ?? []}
            curricula={curriculaQuery.data ?? []}
          />
        )}
      </Reveal>
    </DashboardShell>
  );
}
