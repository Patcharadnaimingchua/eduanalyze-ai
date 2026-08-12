'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap } from 'lucide-react';
import { fetchOwnStudentProfile } from '@/lib/api/dashboard';
import { fetchCourses } from '@/lib/api/academic-record';
import { fetchCurriculum } from '@/lib/api/plo-achievement';
import { fetchLearningPath } from '@/lib/api/learning-path';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { MissingCoursesList } from '@/components/credit-checker/missing-courses-list';
import { DragDropPlanner } from '@/components/learning-path/drag-drop-planner';
import { ElectiveCategoryList } from '@/components/learning-path/elective-category-list';

export default function LearningPathPage() {
  return (
    <ProtectedRoute>
      <LearningPathContent />
    </ProtectedRoute>
  );
}

function LearningPathContent() {
  const { user } = useAuth();
  const isStudent = !!user?.roles.includes('STUDENT');

  const profileQuery = useQuery({
    queryKey: ['student-profile-me'],
    queryFn: fetchOwnStudentProfile,
    enabled: isStudent,
  });
  const studentProfileId = profileQuery.data?.id;
  const curriculumId = profileQuery.data?.curriculumId;

  const pathQuery = useQuery({
    queryKey: ['learning-path', studentProfileId],
    queryFn: () => fetchLearningPath(studentProfileId!),
    enabled: !!studentProfileId,
  });
  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
    enabled: !!studentProfileId,
  });
  const curriculumQuery = useQuery({
    queryKey: ['curriculum', curriculumId],
    queryFn: () => fetchCurriculum(curriculumId!),
    enabled: !!curriculumId,
  });

  const courseCountByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const course of coursesQuery.data ?? []) {
      map.set(course.categoryId, (map.get(course.categoryId) ?? 0) + 1);
    }
    return map;
  }, [coursesQuery.data]);

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
    profileQuery.isLoading || pathQuery.isLoading || coursesQuery.isLoading || curriculumQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (
    profileQuery.isError ||
    pathQuery.isError ||
    coursesQuery.isError ||
    curriculumQuery.isError ||
    !profileQuery.data ||
    !pathQuery.data ||
    !curriculumQuery.data
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>
      </div>
    );
  }

  const path = pathQuery.data;

  return (
    <DashboardShell studentCode={profileQuery.data.studentCode} fullName={user.fullName}>
      <div>
        <h1 className="text-2xl font-semibold text-primary">แผนการเรียน</h1>
        <p className="text-sm text-muted-foreground">
          แนะนำวิชาที่ควรเรียนต่อ ตามผลการเรียนและ Prerequisite ของคุณ
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          icon={GraduationCap}
          label="วิชาบังคับที่ยังขาด"
          value={path.graduationReadiness.missingRequiredCount}
          suffix="วิชา"
          badge={
            path.graduationReadiness.isReady
              ? { text: 'พร้อมสำเร็จการศึกษา', tone: 'positive' }
              : { text: 'ยังไม่พร้อม', tone: 'neutral' }
          }
        />
      </div>

      <DragDropPlanner
        availableCourses={path.availableCourses}
        nextSemesterPlan={path.nextSemesterPlan}
        maxCreditsPerSemester={curriculumQuery.data.maxCreditsPerSemester}
      />
      <MissingCoursesList courses={path.missingRequiredCourses} />
      <ElectiveCategoryList
        categories={path.incompleteElectiveCategories}
        courseCountByCategory={courseCountByCategory}
      />
    </DashboardShell>
  );
}
