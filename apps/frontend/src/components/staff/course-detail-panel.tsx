'use client';

import type { CourseListItem } from '@eduanalyze-ai/shared-types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { PrerequisiteSection } from './prerequisite-section';
import { CourseInstructorSection } from './course-instructor-section';

export type CourseDetailTab = 'prerequisites' | 'instructors';

const TABS: { key: CourseDetailTab; label: string }[] = [
  { key: 'prerequisites', label: 'วิชาที่เป็นตัวก่อน' },
  { key: 'instructors', label: 'อาจารย์ผู้สอน' },
];

// Same tab-strip shape as components/instructor/instructor-detail-panel.tsx
// — unlike that one, both sections here are cheap (small in-scope lists),
// so no lazy per-tab useQuery is needed; each section owns its own query.
export function CourseDetailPanel({
  course,
  coursesInCurriculum,
  activeTab,
  onTabChange,
}: {
  course: CourseListItem;
  coursesInCurriculum: CourseListItem[];
  activeTab: CourseDetailTab;
  onTabChange: (tab: CourseDetailTab) => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{course.code}</p>
          <p className="text-lg font-medium text-primary">{course.name}</p>
        </div>

        <div className="flex gap-2 border-b border-slate-100">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onTabChange(key)}
              className={cn(
                'border-b-2 px-3 py-2 text-sm font-medium transition',
                activeTab === key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-500 hover:text-primary',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'prerequisites' && (
          <PrerequisiteSection courseId={course.id} coursesInCurriculum={coursesInCurriculum} />
        )}
        {activeTab === 'instructors' && <CourseInstructorSection courseId={course.id} />}
      </CardContent>
    </Card>
  );
}
