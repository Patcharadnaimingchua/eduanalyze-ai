import { ArrowLeftRight } from 'lucide-react';
import type { AvailableCourse } from '@eduanalyze-ai/shared-types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Native HTML5 Drag and Drop API — no dnd library in this project (see
// TODO.md), zero-dependency, same convention as combobox/radar-chart.
// Native drag doesn't work on touch devices at all (a real spec
// limitation) — the "ย้ายเข้าแผน/เอาออกจากแผน" button below is an
// always-visible alternative (not touch-detected, since detection can be
// wrong) that calls the exact same move functions DragDropPlanner already
// uses for drop events, so there's only one state update path either way.
export function CourseDragCard({
  course,
  moveLabel,
  onMove,
}: Readonly<{
  course: AvailableCourse;
  moveLabel: string;
  onMove: () => void;
}>) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', course.courseId);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="flex cursor-grab flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-slate-100 bg-white p-3 active:cursor-grabbing"
    >
      {/* basis-48 + wrap: when the column is too narrow for name, badge and
          button on one line, the actions drop below instead of squeezing
          the course name to zero width. */}
      <div className="min-w-0 grow basis-48">
        <p className="text-sm font-medium text-primary">
          {course.code}: {course.name}
        </p>
        <p className="text-xs text-muted-foreground">{course.credits} หน่วยกิต</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            course.isRequired ? 'bg-brand-light text-brand' : 'bg-slate-100 text-slate-600',
          )}
        >
          {course.isRequired ? 'วิชาบังคับ' : 'วิชาเลือก'}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-auto gap-1 whitespace-normal py-1.5 text-left"
          onClick={onMove}
        >
          <ArrowLeftRight size={14} aria-hidden="true" />
          {moveLabel}
        </Button>
      </div>
    </div>
  );
}
