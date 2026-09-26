'use client';

import type { SystemCurriculumEntry } from '@eduanalyze-ai/shared-types';
import { BAR_TONE_CLASSES } from '@/lib/tone';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const TIERS = [
  { state: 'HAS_STUDENTS', label: 'มีนักศึกษา', tone: 'success' } as const,
  { state: 'STRUCTURE_ONLY', label: 'จัดโครงสร้างแล้ว', tone: 'warning' } as const,
  { state: 'EMPTY', label: 'ยังไม่ได้จัดทำ', tone: 'neutral' } as const,
];

export function CurriculumTierSummary({ curricula }: { curricula: SystemCurriculumEntry[] }) {
  const total = curricula.length;
  const counts = TIERS.map((tier) => ({
    ...tier,
    count: curricula.filter((c) => c.dataState === tier.state).length,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>สัดส่วนหลักสูตรตามสถานะข้อมูล</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">ยังไม่มีหลักสูตรในระบบ</p>
        ) : (
          <>
            <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">
              {counts
                .filter((tier) => tier.count > 0)
                .map((tier) => (
                  <Tooltip key={tier.state}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn('h-full', BAR_TONE_CLASSES[tier.tone])}
                        style={{ width: `${(tier.count / total) * 100}%` }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {tier.label}: {tier.count} หลักสูตร
                    </TooltipContent>
                  </Tooltip>
                ))}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {counts.map((tier) => (
                <span key={tier.state} className="flex items-center gap-1.5 text-muted-foreground">
                  <span className={cn('h-2.5 w-2.5 rounded-full', BAR_TONE_CLASSES[tier.tone])} />
                  {tier.label} <span className="font-medium text-primary">{tier.count}</span>
                </span>
              ))}
              <span className="text-muted-foreground">จากทั้งหมด {total} หลักสูตร</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
