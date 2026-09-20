'use client';

import type { CourseListItem } from '@eduanalyze-ai/shared-types';
import { usePagination } from '@/lib/use-pagination';
import { useTableSort } from '@/lib/use-table-sort';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { SortHeader } from '@/components/ui/sort-header';

export function CourseListTable({
  courses,
  selectedCourseId,
  onSelect,
}: {
  courses: CourseListItem[];
  selectedCourseId: string | null;
  onSelect: (courseId: string) => void;
}) {
  const sort = useTableSort(courses, {
    code: (c) => c.code,
    name: (c) => c.name,
    credits: (c) => c.credits,
    status: (c) => (c.isActive ? 0 : 1),
  });
  // courses[0].id changes when the parent switches category, which should
  // start the new category at page 1 rather than mid-list.
  const pagination = usePagination(
    sort.sorted,
    undefined,
    `${courses[0]?.id ?? ''}|${courses.length}|${sort.sortKey}|${sort.direction}`,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">รายวิชาในหมวดนี้</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-muted-foreground">
                <SortHeader {...sort.sortProps('code')}>รหัสวิชา</SortHeader>
                <SortHeader {...sort.sortProps('name')}>ชื่อวิชา</SortHeader>
                <SortHeader {...sort.sortProps('credits')}>หน่วยกิต</SortHeader>
                <SortHeader {...sort.sortProps('status')} className="pr-0">
                  สถานะ
                </SortHeader>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    ยังไม่มีวิชาในหมวดนี้
                  </td>
                </tr>
              )}
              {pagination.pageRows.map((course) => (
                <tr
                  key={course.id}
                  onClick={() => onSelect(course.id)}
                  className={cn(
                    'cursor-pointer border-b border-slate-50 hover:bg-slate-50',
                    selectedCourseId === course.id && 'bg-brand-light/40',
                  )}
                >
                  <td className="py-3 pr-4 text-primary">{course.code}</td>
                  <td className="py-3 pr-4">{course.name}</td>
                  <td className="py-3 pr-4">{course.credits}</td>
                  <td className="py-3 pr-0">
                    <Badge tone={course.isActive ? 'green' : 'gray'}>
                      {course.isActive ? 'ใช้งานอยู่' : 'ระงับการใช้งาน'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination {...pagination} onPageChange={pagination.setPage} />
      </CardContent>
    </Card>
  );
}
