'use client';

import { Suspense } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { fetchCourses } from '@/lib/api/academic-record';
import { fetchCourseCategories, fetchCurriculumRequirements } from '@/lib/api/staff';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { CurriculumPicker } from '@/components/staff/curriculum-picker';
import { CourseCategoryForm } from '@/components/staff/course-category-form';
import { CourseCategoryCard } from '@/components/staff/course-category-card';
import { CourseForm } from '@/components/staff/course-form';
import { CourseListTable } from '@/components/staff/course-list-table';
import { CourseDetailPanel, type CourseDetailTab } from '@/components/staff/course-detail-panel';

export default function StaffCurriculumPage() {
  return (
    <ProtectedRoute>
      <RequireRole role="STAFF">
        {/* useSearchParams requires a Suspense boundary in the App Router */}
        <Suspense fallback={<p className="p-8 text-muted-foreground">กำลังโหลดข้อมูล...</p>}>
          <StaffCurriculumContent />
        </Suspense>
      </RequireRole>
    </ProtectedRoute>
  );
}

function StaffCurriculumContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const curriculumId = searchParams.get('curriculumId');
  const categoryId = searchParams.get('categoryId');
  const courseId = searchParams.get('courseId');
  const tabParam = searchParams.get('tab');
  const activeTab: CourseDetailTab = tabParam === 'instructors' ? 'instructors' : 'prerequisites';

  const categoriesQuery = useQuery({ queryKey: ['course-categories'], queryFn: fetchCourseCategories });
  const requirementsQuery = useQuery({
    queryKey: ['curriculum-requirements'],
    queryFn: fetchCurriculumRequirements,
  });
  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: fetchCourses });

  function setParams(next: { curriculumId?: string | null; categoryId?: string | null; courseId?: string | null; tab?: string | null }) {
    const params = new URLSearchParams(searchParams.toString());
    const apply = (key: string, value: string | null | undefined) => {
      if (value === undefined) return;
      if (value === null) params.delete(key);
      else params.set(key, value);
    };
    apply('curriculumId', next.curriculumId);
    apply('categoryId', next.categoryId);
    apply('courseId', next.courseId);
    apply('tab', next.tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function refetchAll() {
    queryClient.invalidateQueries({ queryKey: ['course-categories'] });
    queryClient.invalidateQueries({ queryKey: ['curriculum-requirements'] });
    queryClient.invalidateQueries({ queryKey: ['courses'] });
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const categoriesInCurriculum = (categoriesQuery.data ?? []).filter(
    (c) => c.curriculumId === curriculumId,
  );
  const requirementByCategoryId = new Map(
    (requirementsQuery.data ?? []).map((r) => [r.categoryId, r]),
  );
  const coursesInCategory = (coursesQuery.data ?? []).filter((c) => c.categoryId === categoryId);
  const coursesInCurriculum = (coursesQuery.data ?? []).filter((c) => c.curriculumId === curriculumId);
  const selectedCourse = coursesInCategory.find((c) => c.id === courseId) ?? null;

  return (
    <DashboardShell role="STAFF" identityLabel={user.email} fullName={user.fullName}>
      <div>
        <h1 className="text-2xl font-semibold text-primary">ข้อมูลหลักสูตร</h1>
        <p className="text-sm text-muted-foreground">
          จัดการหมวดวิชา รายวิชา วิชาที่เป็นตัวก่อน และอาจารย์ผู้สอน ภายในขอบเขตของคุณ
        </p>
      </div>

      <CurriculumPicker
        curriculumId={curriculumId}
        onSelect={(id) => setParams({ curriculumId: id, categoryId: null, courseId: null, tab: null })}
      />

      {curriculumId && (
        <>
          <CourseCategoryForm curriculumId={curriculumId} onCreated={refetchAll} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {categoriesInCurriculum.map((category) => (
              <CourseCategoryCard
                key={category.id}
                category={category}
                requirement={requirementByCategoryId.get(category.id)}
                isSelected={category.id === categoryId}
                onSelect={() =>
                  setParams({ categoryId: category.id, courseId: null, tab: null })
                }
                onChanged={refetchAll}
              />
            ))}
          </div>
        </>
      )}

      {categoryId && (
        <>
          <CourseForm curriculumId={curriculumId!} categoryId={categoryId} onCreated={refetchAll} />
          <CourseListTable
            courses={coursesInCategory}
            selectedCourseId={courseId}
            onSelect={(id) => setParams({ courseId: id, tab: 'prerequisites' })}
          />
        </>
      )}

      {selectedCourse && (
        <CourseDetailPanel
          course={selectedCourse}
          coursesInCurriculum={coursesInCurriculum}
          activeTab={activeTab}
          onTabChange={(tab) => setParams({ tab })}
        />
      )}
    </DashboardShell>
  );
}
