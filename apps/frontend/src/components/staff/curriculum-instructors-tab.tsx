import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { InstructorEntry } from './curriculum-view';

// Who is assigned to what in this curriculum, from the assignments the page
// already holds. Each course code opens that course in the structure tab.
export function CurriculumInstructorsTab({
  entries,
  courseHref,
}: Readonly<{
  entries: InstructorEntry[];
  courseHref: (courseId: string) => string;
}>) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          ยังไม่มีการมอบหมายอาจารย์ผู้รับผิดชอบวิชาในหลักสูตรนี้
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {entries.map((entry) => (
        <li key={entry.userId}>
          <Card className="h-full">
            <CardContent className="space-y-3 p-4 sm:p-5">
              <div>
                <p className="break-words font-semibold text-primary">{entry.name}</p>
                {entry.email && (
                  <p className="break-all text-sm text-muted-foreground">{entry.email}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                รับผิดชอบ <span className="tabular-nums">{entry.courses.length}</span> วิชา
              </p>
              <ul className="flex flex-wrap gap-2">
                {entry.courses.map((course) => (
                  <li key={course.id}>
                    <Link
                      href={courseHref(course.id)}
                      className="inline-flex min-h-11 items-center rounded border border-slate-300 bg-card px-3 text-sm font-semibold tabular-nums text-primary hover:bg-slate-50"
                    >
                      {course.code}
                      <span className="sr-only"> {course.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
