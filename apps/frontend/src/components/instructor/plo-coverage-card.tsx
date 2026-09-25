'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { aggregateInstructorPlos, coursesByPlo } from '@/lib/aggregate-instructor-plos';
import { achievementStatus } from '@/lib/achievement-status';
import { cn } from '@/lib/utils';
import { PloRadarChart } from '@/components/aptitude-analysis/plo-radar-chart';
import { PloProgressTable } from '@/components/dashboard/plo-progress-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const COMPACT_SIZE = 260;

// Deliberately not reusing PloRadarCard: that component hardcodes a title
// meant for a single student's own score ("คะแนนเฉลี่ยราย PLO"), but this
// value is a studentCount-weighted average of achievementPercent across
// every course the instructor teaches — a different metric shown at the
// same visual scale (formatFiveScale applies uniformly to any 0-100
// achievement percent app-wide, per lib/five-scale.ts). Copying the small
// chart+table-toggle shell here avoids adding a title prop to a component
// two student pages already depend on.
export function PloCoverageCard({ courses }: Readonly<{ courses: InstructorCourseSummary[] }>) {
  const radar = aggregateInstructorPlos(courses);
  const contributionsByPlo = coursesByPlo(courses);
  const [selectedPloId, setSelectedPloId] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();

  function toggleSelected(ploId: string) {
    setSelectedPloId((current) => (current === ploId ? null : ploId));
  }

  const selectedPlo = selectedPloId ? radar.find((plo) => plo.ploId === selectedPloId) : undefined;
  const selectedContributions = selectedPloId ? (contributionsByPlo.get(selectedPloId) ?? []) : [];

  return (
    <PloRadarChart
      radar={radar}
      size={COMPACT_SIZE}
      title="PLO ที่วิชาของฉันสนับสนุน"
      selectedPloId={selectedPloId}
      onSelectPlo={toggleSelected}
      footer={
        <div className="space-y-4 border-t pt-4">
          {radar.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {radar.map((plo) => {
                const isActive = plo.ploId === selectedPloId;
                return (
                  <button
                    key={plo.ploId}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => toggleSelected(plo.ploId)}
                    className={cn(
                      'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition',
                      isActive
                        ? 'border-brand bg-brand-light text-brand'
                        : 'border-slate-200 text-slate-600 hover:border-brand hover:text-brand',
                    )}
                  >
                    {plo.code}
                  </button>
                );
              })}
            </div>
          )}

          {selectedPlo && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">
                วิชาที่สนับสนุน {selectedPlo.code} · {selectedPlo.name}
              </p>
              {selectedContributions.length === 0 ? (
                <p className="text-sm text-muted-foreground">ไม่พบวิชาที่ CLO ผูกกับ PLO นี้</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                  {selectedContributions.map((c) => {
                    const status = achievementStatus(c.achievementPercent, c.achievementThreshold);
                    return (
                      <li
                        key={c.courseId}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                      >
                        <Link
                          href={`/instructor/courses/${c.courseId}?tab=clo`}
                          className="min-w-0 font-medium text-brand hover:underline"
                        >
                          {c.code} {c.name}
                        </Link>
                        <span className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {Math.round(c.achievementPercent)}%
                          </span>
                          <Badge tone={status.tone}>{status.label}</Badge>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowTable((v) => !v)}
            aria-expanded={showTable}
            aria-controls={tableId}
            className="w-full justify-center gap-1.5 text-muted-foreground"
          >
            {showTable ? 'ซ่อนตาราง' : `ดูเป็นตาราง (${radar.length} PLO)`}
            <ChevronDown size={14} className={cn('transition-transform', showTable && 'rotate-180')} />
          </Button>
          {showTable && (
            <div id={tableId}>
              <PloProgressTable radar={radar} />
            </div>
          )}
        </div>
      }
    />
  );
}
