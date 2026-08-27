'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ArrowLeft } from 'lucide-react';
import { fetchAcademicYears, fetchCourses, fetchMyGpa, fetchSemesters } from '@/lib/api/academic-record';
import { fetchCourseRecordsInScope, fetchStudentProfile } from '@/lib/api/staff';
import { fetchCurricula, fetchPrograms } from '@/lib/api/organization';
import { formatSemesterLabel } from '@/lib/grade-label';
import { gpaColorClassName } from '@/lib/gpa-color';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { AddRecordForm } from '@/components/academic-record/add-record-form';
import { StaffRecordTable } from '@/components/staff/student-record-table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

  function refetchRecords() {
    queryClient.invalidateQueries({ queryKey: ['staff-course-records'] });
    queryClient.invalidateQueries({ queryKey: ['staff-student-gpa', studentProfileId] });
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
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

      {profileQuery.isLoading && <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>}
      {forbidden && (
        <p className="text-sm text-destructive">ไม่มีสิทธิ์เข้าถึงนักศึกษาคนนี้</p>
      )}
      {profileQuery.isError && !forbidden && (
        <p className="text-sm text-destructive">ไม่พบนักศึกษา</p>
      )}

      {profile && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ข้อมูลนักศึกษา</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-lg font-medium text-primary">{profile.user.fullName}</p>
              <p className="text-sm text-muted-foreground">{profile.user.email}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span>รหัสนักศึกษา: {profile.studentCode}</span>
                <span>สาขา: {program?.name ?? '—'}</span>
                <span>ฉบับหลักสูตร: {curriculum?.version ?? '—'}</span>
                <span>ปีเข้าศึกษา: {profile.admissionYear}</span>
              </div>
              <Badge tone={profile.isActive ? 'green' : 'gray'}>
                {profile.isActive ? 'ใช้งานอยู่' : 'ระงับการใช้งาน'}
              </Badge>
            </CardContent>
          </Card>

          {gpa && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">GPA สะสม</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-semibold ${gpaColorClassName(gpa.gpa)}`}>
                  {gpa.gpa !== null ? gpa.gpa.toFixed(2) : '—'}
                </p>
                <p className="text-sm text-muted-foreground">{gpa.creditsCounted} หน่วยกิตสะสม</p>
              </CardContent>
            </Card>
          )}

          <AddRecordForm
            studentProfileId={studentProfileId}
            courses={filteredCourses}
            semesterOptions={joinedSemesters}
            onCreated={refetchRecords}
          />

          <StaffRecordTable
            records={ownRecords}
            courseMap={courseMap}
            semesterMap={semesterMap}
            onChanged={refetchRecords}
          />
        </>
      )}
    </DashboardShell>
  );
}
