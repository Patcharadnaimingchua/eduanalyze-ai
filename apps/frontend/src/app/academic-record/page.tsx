'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { gpaColorClassName } from '@/lib/gpa-color';
import { useCountUp } from '@/lib/use-count-up';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { AddRecordForm } from '@/components/academic-record/add-record-form';
import { RecordTimeline } from '@/components/academic-record/record-timeline';

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

  const gpa = gpaQuery.data;

  // Called unconditionally (before the loading/error early-returns below)
  // so Rules of Hooks holds — target defaults to 0 while gpa hasn't
  // loaded yet, then flips to the real number once gpaQuery resolves,
  // which is exactly what triggers the 0→target count-up (same pattern
  // Dashboard F2 uses, just without needing a separate child component
  // here since this page's StatCard trio is fixed, not looped).
  const animatedGpa = useCountUp(gpa?.gpa ?? 0, { duration: 900, decimals: 2 });
  const animatedCredits = useCountUp(gpa?.creditsCounted ?? 0, { duration: 900, decimals: 0 });
  const animatedCourseCount = useCountUp(gpa?.courseCount ?? 0, { duration: 900, decimals: 0 });

  function refetchAll() {
    queryClient.invalidateQueries({ queryKey: ['my-course-records'] });
    queryClient.invalidateQueries({ queryKey: ['my-gpa', studentProfileId] });
  }

  // Highlight the just-added record for a moment — cleared automatically
  // so the caller never has to remember to reset it. 2000ms hold before
  // the transition-colors duration-500 fade starts (same duration unit
  // as every other animation on this page).
  const [highlightRecordId, setHighlightRecordId] = useState<string | null>(null);
  useEffect(() => {
    if (!highlightRecordId) return;
    const timer = setTimeout(() => setHighlightRecordId(null), 2000);
    return () => clearTimeout(timer);
  }, [highlightRecordId]);

  function handleRecordCreated(newRecordId: string) {
    refetchAll();
    setHighlightRecordId(newRecordId);
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

  return (
    <DashboardShell studentCode={profileQuery.data.studentCode} fullName={user.fullName}>
      <div>
        <h1 className="text-2xl font-semibold text-primary">การติดตามผลการเรียน</h1>
        <p className="text-sm text-muted-foreground">บันทึกและจัดการรายวิชาที่คุณเรียนไปแล้ว</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: '75ms', animationFillMode: 'both' }}
        >
          <StatCard
            icon={Star}
            label="เกรดเฉลี่ยสะสม"
            value={
              gpa?.gpa != null ? (
                <span className={gpaColorClassName(gpa.gpa)}>{animatedGpa.toFixed(2)}</span>
              ) : (
                '—'
              )
            }
            suffix="/ 4.0"
          />
        </div>
        <div
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: '150ms', animationFillMode: 'both' }}
        >
          <StatCard icon={FileCheck2} label="หน่วยกิตที่นับ GPA" value={Math.round(animatedCredits)} />
        </div>
        <div
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: '225ms', animationFillMode: 'both' }}
        >
          <StatCard icon={GraduationCap} label="จำนวนวิชาที่บันทึก" value={Math.round(animatedCourseCount)} />
        </div>
      </div>

      <div
        className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        style={{ animationDelay: '300ms', animationFillMode: 'both' }}
      >
        <AddRecordForm
          studentProfileId={profileQuery.data.id}
          courses={filteredCourses}
          semesterOptions={joinedSemesters}
          onCreated={handleRecordCreated}
        />
      </div>

      <div
        className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        style={{ animationDelay: '375ms', animationFillMode: 'both' }}
      >
        <RecordTimeline
          records={recordsQuery.data ?? []}
          courseMap={courseMap}
          semesters={joinedSemesters}
          gpaBySemester={gpa?.bySemester ?? []}
          highlightRecordId={highlightRecordId}
          onChanged={refetchAll}
        />
      </div>
    </DashboardShell>
  );
}
