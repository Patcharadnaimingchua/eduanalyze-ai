'use client';

import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, FileCheck2, Star } from 'lucide-react';
import { fetchOwnStudentProfile } from '@/lib/api/dashboard';
import {
  fetchAcademicYears,
  fetchCourses,
  fetchMyCourseRecords,
  fetchMyGpa,
  fetchSemesters,
} from '@/lib/api/academic-record';
import { formatSemesterLabel } from '@/lib/grade-label';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { AddRecordForm } from '@/components/academic-record/add-record-form';
import { RecordTimeline } from '@/components/academic-record/record-timeline';
import { GpaTrendChart } from '@/components/academic-record/gpa-trend-chart';

const TERM_ORDER: Record<string, number> = { FIRST: 0, SECOND: 1, SUMMER: 2 };

export default function AcademicRecordPage() {
  return (
    <ProtectedRoute>
      <AcademicRecordContent />
    </ProtectedRoute>
  );
}

function AcademicRecordContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isStudent = !!user?.roles.includes('STUDENT');

  const profileQuery = useQuery({
    queryKey: ['student-profile-me'],
    queryFn: fetchOwnStudentProfile,
    enabled: isStudent,
  });
  const studentProfileId = profileQuery.data?.id;

  const recordsQuery = useQuery({
    queryKey: ['my-course-records'],
    queryFn: fetchMyCourseRecords,
    enabled: !!studentProfileId,
  });
  const gpaQuery = useQuery({
    queryKey: ['my-gpa', studentProfileId],
    queryFn: () => fetchMyGpa(studentProfileId!),
    enabled: !!studentProfileId,
  });
  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: fetchCourses, enabled: !!studentProfileId });
  const academicYearsQuery = useQuery({
    queryKey: ['academic-years'],
    queryFn: fetchAcademicYears,
    enabled: !!studentProfileId,
  });
  const semestersQuery = useQuery({
    queryKey: ['semesters'],
    queryFn: fetchSemesters,
    enabled: !!studentProfileId,
  });

  const courseMap = useMemo(() => {
    const map = new Map((coursesQuery.data ?? []).map((c) => [c.id, c]));
    return map;
  }, [coursesQuery.data]);

  const filteredCourses = useMemo(() => {
    if (!profileQuery.data) return [];
    return (coursesQuery.data ?? [])
      .filter((c) => c.curriculumId === profileQuery.data.curriculumId)
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [coursesQuery.data, profileQuery.data]);

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

  function refetchAll() {
    queryClient.invalidateQueries({ queryKey: ['my-course-records'] });
    queryClient.invalidateQueries({ queryKey: ['my-gpa', studentProfileId] });
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (!isStudent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">หน้านี้สำหรับนักศึกษาเท่านั้น</p>
      </div>
    );
  }

  const isLoading =
    profileQuery.isLoading ||
    recordsQuery.isLoading ||
    gpaQuery.isLoading ||
    coursesQuery.isLoading ||
    academicYearsQuery.isLoading ||
    semestersQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (
    profileQuery.isError ||
    recordsQuery.isError ||
    gpaQuery.isError ||
    coursesQuery.isError ||
    academicYearsQuery.isError ||
    semestersQuery.isError ||
    !profileQuery.data
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>
      </div>
    );
  }

  const gpa = gpaQuery.data;

  return (
    <DashboardShell studentCode={profileQuery.data.studentCode} fullName={user.fullName}>
      <div>
        <h1 className="text-2xl font-semibold text-primary">การติดตามผลการเรียน</h1>
        <p className="text-sm text-muted-foreground">บันทึกและจัดการรายวิชาที่คุณเรียนไปแล้ว</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          icon={Star}
          label="เกรดเฉลี่ยสะสม"
          value={gpa?.gpa != null ? gpa.gpa.toFixed(2) : '—'}
          suffix="/ 4.0"
        />
        <StatCard icon={FileCheck2} label="หน่วยกิตที่นับ GPA" value={gpa?.creditsCounted ?? 0} />
        <StatCard icon={GraduationCap} label="จำนวนวิชาที่บันทึก" value={gpa?.courseCount ?? 0} />
      </div>

      <AddRecordForm
        studentProfileId={profileQuery.data.id}
        courses={filteredCourses}
        semesterOptions={joinedSemesters}
        onCreated={refetchAll}
      />

      <GpaTrendChart semesters={joinedSemesters} gpaBySemester={gpa?.bySemester ?? []} />

      <RecordTimeline
        records={recordsQuery.data ?? []}
        courseMap={courseMap}
        semesters={joinedSemesters}
        gpaBySemester={gpa?.bySemester ?? []}
        onChanged={refetchAll}
      />
    </DashboardShell>
  );
}
