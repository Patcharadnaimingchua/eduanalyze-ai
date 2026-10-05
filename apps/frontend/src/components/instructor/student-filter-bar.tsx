'use client';

import type { RiskLevel } from '@eduanalyze-ai/shared-types';
import { ALL, type RiskCounts, type RiskFilter } from '@/lib/student-directory';
import { RISK_LEVEL_LABELS, RISK_LEVEL_ORDER, RISK_LEVEL_TONES } from '@/lib/risk-level';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// 44px tall on phones (touch), the usual 36px from sm up.
const CONTROL_HEIGHT = 'h-11 sm:h-9';

// The risk buttons double as the page's numbers: each shows how many people
// it would leave, so there is no separate stat card repeating them.
export function StudentFilterBar({
  counts,
  risk,
  onRiskChange,
  courses,
  courseId,
  onCourseChange,
  search,
  onSearchChange,
  isFiltered,
  onClear,
}: Readonly<{
  counts: RiskCounts;
  risk: RiskFilter;
  onRiskChange: (risk: RiskFilter) => void;
  courses: { courseId: string; code: string; name: string }[];
  courseId: string;
  onCourseChange: (courseId: string) => void;
  search: string;
  onSearchChange: (q: string) => void;
  isFiltered: boolean;
  onClear: () => void;
}>) {
  const options: { value: RiskFilter; label: string; count: number; level?: RiskLevel }[] = [
    { value: ALL, label: 'ทั้งหมด', count: counts.total },
    ...RISK_LEVEL_ORDER.map((level) => ({
      value: level,
      label: RISK_LEVEL_LABELS[level],
      count: counts[level],
      level,
    })),
  ];

  return (
    <div className="space-y-3">
      <div role="group" aria-label="กรองตามระดับความเสี่ยง" className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = risk === option.value;
          return (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={selected ? 'default' : 'outline'}
              aria-pressed={selected}
              onClick={() => onRiskChange(option.value)}
              className={cn(CONTROL_HEIGHT, 'gap-2', selected && 'font-semibold')}
            >
              {option.label}
              {option.level && option.count > 0 ? (
                <Badge tone={RISK_LEVEL_TONES[option.level]}>{option.count}</Badge>
              ) : (
                <span className={selected ? undefined : 'text-muted-foreground'}>{option.count}</span>
              )}
            </Button>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Select value={courseId} onValueChange={onCourseChange}>
          <SelectTrigger className={cn(CONTROL_HEIGHT, 'sm:w-64')} aria-label="กรองตามวิชา">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>ทุกวิชา</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.courseId} value={c.courseId}>
                {c.code} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="search"
          placeholder="ค้นหารหัสหรือชื่อนักศึกษา"
          aria-label="ค้นหารหัสหรือชื่อนักศึกษา"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(CONTROL_HEIGHT, 'sm:max-w-xs')}
        />
        {isFiltered && (
          <Button type="button" variant="ghost" size="sm" onClick={onClear} className={CONTROL_HEIGHT}>
            ล้างตัวกรอง
          </Button>
        )}
      </div>
    </div>
  );
}
