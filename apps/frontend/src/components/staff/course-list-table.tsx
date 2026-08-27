'use client';

import type { CourseListItem } from '@eduanalyze-ai/shared-types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CourseListTable({
  courses,
  selectedCourseId,
  onSelect,
}: {
  courses: CourseListItem[];
  selectedCourseId: string | null;
  onSelect: (courseId: string) => void;
}) {
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
                <th className="py-2 pr-4 font-medium">รหัสวิชา</th>
                <th className="py-2 pr-4 font-medium">ชื่อวิชา</th>
                <th className="py-2 pr-4 font-medium">หน่วยกิต</th>
                <th className="py-2 pr-0 font-medium">สถานะ</th>
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
              {courses.map((course) => (
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
      </CardContent>
    </Card>
  );
}
