'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { StudentPloRadarPoint } from '@eduanalyze-ai/shared-types';
import { cn } from '@/lib/utils';
import { ploProgressBarColorClassName } from '@/lib/plo-color';
import { formatFiveScale, percentToFiveScale } from '@/lib/five-scale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const breakdownId = `plo-${plo.ploId}-clo-details`;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">{plo.code}</p>
            <p className="mt-1 text-base font-medium text-primary">{plo.name}</p>
          </div>
          <Badge tone={!hasValue ? 'neutral' : isAchieved ? 'success' : 'neutral'}>
            {!hasValue ? 'ไม่มีข้อมูล' : isAchieved ? 'ผ่านเกณฑ์' : 'ยังไม่ผ่านเกณฑ์'}
          </Badge>
        </div>

        {description && <p className="min-h-10 text-sm leading-5 text-muted-foreground">{description}</p>}

        <div className="space-y-2 rounded-md bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">ความสำเร็จ</span>
            <span className="font-semibold text-primary">
              {plo.value === null ? '—' : `${formatFiveScale(plo.value)} / 5.0`}
            </span>
          </div>
          {threshold !== null && (
            <p className="text-xs text-muted-foreground">
              เกณฑ์ผ่าน ≥ {percentToFiveScale(threshold).toFixed(1)} / 5.0
            </p>
          )}
          <Progress
            value={plo.value ?? 0}
            className="w-full"
            barClassName={ploProgressBarColorClassName(plo.value, threshold)}
          />
        </div>

        {hasBreakdown && (
          <Button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            aria-expanded={isExpanded}
            aria-controls={breakdownId}
            variant="ghost"
            size="sm"
            className="w-full justify-center gap-1.5 text-muted-foreground"
          >
            {isExpanded ? 'ซ่อนรายละเอียด CLO' : `ดูรายละเอียด CLO (${plo.cloBreakdown.length})`}
            <ChevronDown
              size={14}
              className={cn('transition-transform', isExpanded && 'rotate-180')}
            />
          </Button>
        )}

        {isExpanded && hasBreakdown && (
          <div id={breakdownId} className="space-y-2 border-t border-slate-100 pt-3">
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
                <Badge tone={clo.score === null ? 'neutral' : clo.isAchieved ? 'success' : 'warning'}>
                  {formatFiveScale(clo.score, 'ไม่มีข้อมูล')}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
