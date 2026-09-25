'use client';

import { Suspense, useState } from 'react';
import { FolderOpen, Plus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { fetchCourses } from '@/lib/api/academic-record';
import { fetchCourseCategories, fetchCurriculumRequirements } from '@/lib/api/staff';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { PageSection } from '@/components/layout/page-section';
import { Reveal } from '@/components/layout/reveal';
import { CurriculumPicker } from '@/components/staff/curriculum-picker';
import { CourseCategoryForm } from '@/components/staff/course-category-form';
import { CourseCategoryCard } from '@/components/staff/course-category-card';
import { CourseForm } from '@/components/staff/course-form';
import { CourseListTable } from '@/components/staff/course-list-table';
import { CourseDetailPanel, type CourseDetailTab } from '@/components/staff/course-detail-panel';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

export default function StaffCurriculumPage() {
  return (
    <ProtectedRoute>
      <RequireRole role="STAFF">
        {/* useSearchParams requires a Suspense boundary in the App Router */}
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <div className="space-y-3">
                <Skeleton className="mx-auto h-10 w-10 rounded-full" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          }
        >
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
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);

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

  function handleCategoryCreated() {
    setShowCategoryForm(false);
    refetchAll();
  }

  function handleCourseCreated() {
    setShowCourseForm(false);
    refetchAll();
  }

  function formToggle(open: boolean, onToggle: () => void, label: string) {
    return (
      <Button
        type="button"
        size="sm"
        variant={open ? 'outline' : 'default'}
        className="gap-1.5"
        onClick={onToggle}
      >
        {open ? (
          'ยกเลิก'
        ) : (
          <>
            <Plus size={16} />
            {label}
          </>
        )}
      </Button>
    );
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
      <Reveal index={0}>
        <PageHeader
          title="ข้อมูลหลักสูตร"
          description="จัดการหมวดวิชา รายวิชา วิชาที่เป็นตัวก่อน และอาจารย์ผู้สอน ภายในขอบเขตของคุณ"
        />
      </Reveal>

      <Reveal index={1}>
        <CurriculumPicker
          curriculumId={curriculumId}
          onSelect={(id) => setParams({ curriculumId: id, categoryId: null, courseId: null, tab: null })}
        />
      </Reveal>

      {curriculumId && (
        <Reveal index={2}>
          <PageSection
            title="หมวดวิชา"
            actions={formToggle(
              showCategoryForm,
              () => setShowCategoryForm((open) => !open),
              'เพิ่มหมวดวิชา',
            )}
          >
            {showCategoryForm && (
              <CourseCategoryForm curriculumId={curriculumId} onCreated={handleCategoryCreated} />
            )}

            {categoriesQuery.data && categoriesInCurriculum.length === 0 ? (
              <EmptyState icon={FolderOpen} description="ยังไม่มีหมวดวิชาในหลักสูตรนี้" />
            ) : (
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
            )}
          </PageSection>
        </Reveal>
      )}

      {categoryId && (
        <Reveal>
          <PageSection
            title="รายวิชาในหมวด"
            actions={formToggle(
              showCourseForm,
              () => setShowCourseForm((open) => !open),
              'เพิ่มรายวิชา',
            )}
          >
            {showCourseForm && (
              <CourseForm
                curriculumId={curriculumId!}
                categoryId={categoryId}
                onCreated={handleCourseCreated}
              />
            )}
            <CourseListTable
              courses={coursesInCategory}
              selectedCourseId={courseId}
              onSelect={(id) => setParams({ courseId: id, tab: 'prerequisites' })}
            />
          </PageSection>
        </Reveal>
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
