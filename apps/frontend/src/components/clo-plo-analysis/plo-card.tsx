'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { StudentPloRadarPoint } from '@eduanalyze-ai/shared-types';
import { cn } from '@/lib/utils';
import { ploProgressBarColorClassName } from '@/lib/plo-color';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function PloCard({
  plo,
  description,
  isAchieved,
  threshold,
}: {
  plo: StudentPloRadarPoint;
  description: string | null;
  isAchieved: boolean;
  threshold: number | null;
}) {
  const hasValue = plo.value !== null;
  const [isExpanded, setIsExpanded] = useState(false);
  const hasBreakdown = plo.cloBreakdown.length > 0;

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{plo.code}</p>
            <p className="font-medium text-primary">{plo.name}</p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
              !hasValue
                ? 'bg-slate-100 text-slate-600'
                : isAchieved
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-slate-100 text-slate-600',
            )}
          >
            {!hasValue ? 'ไม่มีข้อมูล' : isAchieved ? 'Achieved' : 'In Progress'}
          </span>
        </div>

        {description && <p className="text-sm text-muted-foreground">{description}</p>}

        <div className="flex items-center gap-3">
          <Progress
            value={plo.value ?? 0}
            className="flex-1"
            barClassName={ploProgressBarColorClassName(plo.value, threshold)}
          />
          <span className="w-12 text-right text-sm font-medium text-primary">
            {hasValue ? `${Math.round(plo.value!)}%` : '—'}
          </span>
        </div>

        {hasBreakdown && (
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="flex w-full items-center justify-center gap-1.5 rounded-md py-1 text-xs font-medium text-muted-foreground hover:bg-slate-50 hover:text-primary"
          >
            {isExpanded ? 'ซ่อนรายละเอียด CLO' : `ดูรายละเอียด CLO (${plo.cloBreakdown.length})`}
            <ChevronDown
              size={14}
              className={cn('transition-transform', isExpanded && 'rotate-180')}
            />
          </button>
        )}

        {isExpanded && hasBreakdown && (
          <div className="animate-in fade-in-0 duration-300 space-y-2 border-t border-slate-100 pt-3">
            {plo.cloBreakdown.map((clo) => (
              <div
                key={clo.cloId}
                className="flex items-start justify-between gap-3 rounded-md bg-slate-50 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {clo.code} · {clo.courseCode} {clo.courseName}
                  </p>
                  <p className="text-sm text-primary">{clo.description}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                    clo.score === null
                      ? 'bg-slate-100 text-slate-500'
                      : clo.isAchieved
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600',
                  )}
                >
                  {clo.score === null ? 'ไม่มีข้อมูล' : `${Math.round(clo.score)}%`}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
