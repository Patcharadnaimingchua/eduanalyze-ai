'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ArrowLeft, Plus } from 'lucide-react';
import { fetchAcademicYears, fetchCourses, fetchMyGpa, fetchSemesters } from '@/lib/api/academic-record';
import { fetchCourseRecordsInScope, fetchStudentProfile } from '@/lib/api/staff';
import { fetchCurricula, fetchPrograms } from '@/lib/api/organization';
import { formatSemesterLabel } from '@/lib/grade-label';
import { gpaColorClassName } from '@/lib/gpa-color';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { PageLoadError } from '@/components/layout/page-states';
import { PageSection } from '@/components/layout/page-section';
import { Reveal } from '@/components/layout/reveal';
import { AddRecordForm } from '@/components/academic-record/add-record-form';
import { StaffRecordTable } from '@/components/staff/student-record-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton, TableSkeleton } from '@/components/ui/skeleton';

const TERM_ORDER: Record<string, number> = { FIRST: 0, SECOND: 1, SUMMER: 2 };

export default function StaffStudentDetailPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute>
      <RequireRole role="STAFF">
        <StaffStudentDetailContent studentProfileId={params.id} />
      </RequireRole>
    </ProtectedRoute>
  );
}

function StaffStudentDetailContent({ studentProfileId }: { studentProfileId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [showAddForm, setShowAddForm] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['staff-student', studentProfileId],
    queryFn: () => fetchStudentProfile(studentProfileId),
  });
  const gpaQuery = useQuery({
    queryKey: ['staff-student-gpa', studentProfileId],
    queryFn: () => fetchMyGpa(studentProfileId),
  });
  const recordsQuery = useQuery({
    queryKey: ['staff-course-records'],
    queryFn: fetchCourseRecordsInScope,
  });
  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: fetchCourses });
  const academicYearsQuery = useQuery({ queryKey: ['academic-years'], queryFn: fetchAcademicYears });
  const semestersQuery = useQuery({ queryKey: ['semesters'], queryFn: fetchSemesters });
  const programsQuery = useQuery({ queryKey: ['programs'], queryFn: fetchPrograms });
  const curriculaQuery = useQuery({ queryKey: ['curricula'], queryFn: fetchCurricula });

  const courseMap = useMemo(
    () => new Map((coursesQuery.data ?? []).map((c) => [c.id, c])),
    [coursesQuery.data],
  );
  const yearById = useMemo(
    () => new Map((academicYearsQuery.data ?? []).map((y) => [y.id, y.year])),
    [academicYearsQuery.data],
  );
  const joinedSemesters = useMemo(() => {
    return (semestersQuery.data ?? [])
      .map((s) => ({
        id: s.id,
        year: yearById.get(s.academicYearId),
        term: s.term,
        label: formatSemesterLabel(s.term, yearById.get(s.academicYearId)),
      }))
      .sort((a, b) => {
        const yearDiff = (b.year ?? 0) - (a.year ?? 0);
        if (yearDiff !== 0) return yearDiff;
        return TERM_ORDER[b.term] - TERM_ORDER[a.term];
      });
  }, [semestersQuery.data, yearById]);
  const semesterMap = useMemo(
    () => new Map(joinedSemesters.map((s) => [s.id, { label: s.label }])),
    [joinedSemesters],
  );

  const profile = profileQuery.data;
  const filteredCourses = useMemo(() => {
    if (!profile) return [];
    return (coursesQuery.data ?? [])
      .filter((c) => c.curriculumId === profile.curriculumId)
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [coursesQuery.data, profile]);
  const ownRecords = (recordsQuery.data ?? []).filter((r) => r.studentProfileId === studentProfileId);

  function handleRecordCreated() {
    toast.success('เพิ่มรายวิชาแล้ว');
    setShowAddForm(false);
    refetchRecords();
  }

  function refetchRecords() {
    queryClient.invalidateQueries({ queryKey: ['staff-course-records'] });
    queryClient.invalidateQueries({ queryKey: ['staff-student-gpa', studentProfileId] });
  }

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

  const forbidden = isAxiosError(profileQuery.error) && profileQuery.error.response?.status === 403;
  const program = programsQuery.data?.find((p) => p.id === profile?.programId);
  const curriculum = curriculaQuery.data?.find((c) => c.id === profile?.curriculumId);
  const gpa = gpaQuery.data;

  return (
    <DashboardShell role="STAFF" identityLabel={user.email} fullName={user.fullName}>
      <Link
        href="/staff/students"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft size={14} />
        กลับไปทำเนียบนักศึกษา
      </Link>

      {profileQuery.isLoading && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>ข้อมูลนักศึกษา</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>GPA สะสม</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-4 w-28" />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="pt-6">
              <TableSkeleton cols={5} rows={4} />
            </CardContent>
          </Card>
        </div>
      )}
      {forbidden && <PageLoadError message="ไม่มีสิทธิ์เข้าถึงนักศึกษาคนนี้" />}
      {profileQuery.isError && !forbidden && <PageLoadError message="ไม่พบนักศึกษา" />}

      {profile && (
        <>
          <Reveal index={0}>
            <PageHeader
              title={profile.user.fullName}
              description={`${profile.studentCode} · ${profile.user.email}`}
              actions={
                <Badge tone={profile.isActive ? 'success' : 'neutral'}>
                  {profile.isActive ? 'ใช้งานอยู่' : 'ระงับการใช้งาน'}
                </Badge>
              }
            />
          </Reveal>

          <Reveal index={1} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>ข้อมูลนักศึกษา</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">สาขา</dt>
                    <dd className="text-primary">{program?.name ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">ฉบับหลักสูตร</dt>
                    <dd className="text-primary">{curriculum?.version ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">ปีเข้าศึกษา</dt>
                    <dd className="text-primary">{profile.admissionYear}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>GPA สะสม</CardTitle>
              </CardHeader>
              <CardContent>
                {gpa ? (
                  <>
                    <p className={`text-3xl font-semibold ${gpaColorClassName(gpa.gpa)}`}>
                      {gpa.gpa !== null ? gpa.gpa.toFixed(2) : '—'}
                    </p>
                    <p className="text-sm text-muted-foreground">{gpa.creditsCounted} หน่วยกิตสะสม</p>
                  </>
                ) : gpaQuery.isLoading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <p className="text-3xl font-semibold text-muted-foreground">—</p>
                )}
              </CardContent>
            </Card>
          </Reveal>

          <Reveal index={2}>
            <PageSection
              title="ผลการเรียนรายวิชา"
              actions={
                <Button
                  type="button"
                  size="sm"
                  variant={showAddForm ? 'outline' : 'default'}
                  className="gap-1.5"
                  onClick={() => setShowAddForm((open) => !open)}
                >
                  {showAddForm ? (
                    'ยกเลิก'
                  ) : (
                    <>
                      <Plus size={16} />
                      เพิ่มรายวิชา
                    </>
                  )}
                </Button>
              }
            >
              {showAddForm && (
                <AddRecordForm
                  studentProfileId={studentProfileId}
                  courses={filteredCourses}
                  semesterOptions={joinedSemesters}
                  onCreated={handleRecordCreated}
                />
              )}

              <StaffRecordTable
                records={ownRecords}
                courseMap={courseMap}
                semesterMap={semesterMap}
                onChanged={refetchRecords}
              />
            </PageSection>
          </Reveal>
        </>
      )}
    </DashboardShell>
  );
}
