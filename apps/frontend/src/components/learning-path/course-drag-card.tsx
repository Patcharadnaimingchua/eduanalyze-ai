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
}: {
  course: AvailableCourse;
  moveLabel: string;
  onMove: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', course.courseId);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="flex cursor-grab items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white p-3 active:cursor-grabbing"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-primary">
          {course.code}: {course.name}
        </p>
        <p className="text-xs text-muted-foreground">{course.credits} หน่วยกิต</p>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
          course.isRequired ? 'bg-brand-light text-brand' : 'bg-slate-100 text-slate-600',
        )}
      >
        {course.isRequired ? 'วิชาบังคับ' : 'วิชาเลือก'}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 gap-1"
        onClick={onMove}
      >
        <ArrowLeftRight size={14} />
        {moveLabel}
      </Button>
    </div>
  );
}
