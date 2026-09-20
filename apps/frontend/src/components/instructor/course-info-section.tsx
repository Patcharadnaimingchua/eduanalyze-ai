'use client';

import { useQuery } from '@tanstack/react-query';
import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { fetchCourses } from '@/lib/api/academic-record';
import { fetchPrerequisites } from '@/lib/api/staff';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function CourseInfoSection({ course }: { course: InstructorCourseSummary }) {
  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: fetchCourses });
  const prerequisitesQuery = useQuery({ queryKey: ['prerequisites'], queryFn: fetchPrerequisites });

  const courseMap = new Map((coursesQuery.data ?? []).map((c) => [c.id, c]));
  const detail = courseMap.get(course.courseId);
  const prerequisites = (prerequisitesQuery.data ?? []).filter(
    (p) => p.courseId === course.courseId,
  );
  const isLoading = coursesQuery.isLoading || prerequisitesQuery.isLoading;
  const isError = coursesQuery.isError || prerequisitesQuery.isError;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-primary">ข้อมูลรายวิชา</h3>
        {isLoading && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        )}
        {isError && <p className="text-sm text-destructive">ไม่สามารถโหลดข้อมูลรายวิชาได้</p>}
        {detail && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">ชื่อภาษาอังกฤษ</dt>
              <dd className="text-primary">{detail.nameEn ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">หน่วยกิต</dt>
              <dd className="text-primary">{detail.credits}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">ประเภท</dt>
              <dd>
                <Badge tone={detail.isRequired ? 'green' : 'gray'}>
                  {detail.isRequired ? 'วิชาบังคับ' : 'วิชาเลือก'}
                </Badge>
              </dd>
            </div>
          </dl>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-primary">วิชาที่ต้องผ่านก่อน (Prerequisite)</h3>
        {!isLoading && !isError && prerequisites.length === 0 && (
          <p className="text-sm text-muted-foreground">รายวิชานี้ไม่มีวิชาที่ต้องผ่านก่อน</p>
        )}
        {prerequisites.length > 0 && (
          <ul className="space-y-1 text-sm">
            {prerequisites.map((p) => {
              const prereq = courseMap.get(p.prerequisiteCourseId);
              return (
                <li key={p.id} className="text-primary">
                  <span className="text-muted-foreground">{prereq?.code ?? '—'}</span>{' '}
                  {prereq?.name ?? 'ไม่พบข้อมูลวิชา'}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
