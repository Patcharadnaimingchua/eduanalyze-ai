'use client';

import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { cn } from '@/lib/utils';
import { achievementBadgeTone } from '@/lib/achievement-color';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function InstructorCourseCard({
  course,
  selected,
  onSelect,
}: {
  course: InstructorCourseSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button" onClick={onSelect} className="w-full text-left">
      <Card className={cn('transition', selected && 'ring-2 ring-brand')}>
        <CardContent className="space-y-2 pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">{course.code}</p>
              <p className="truncate font-medium text-primary">{course.name}</p>
            </div>
            <Badge tone={achievementBadgeTone(course.achievementPercent)}>
              {Math.round(course.achievementPercent)}%
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{course.studentCount} นักศึกษา</p>
        </CardContent>
      </Card>
    </button>
  );
}
