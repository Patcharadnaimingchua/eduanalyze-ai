'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { InstructorCourseSummary } from '@eduanalyze-ai/shared-types';
import { aggregateInstructorPlos } from '@/lib/aggregate-instructor-plos';
import { cn } from '@/lib/utils';
import { PloRadarChart } from '@/components/aptitude-analysis/plo-radar-chart';
import { PloProgressTable } from '@/components/dashboard/plo-progress-table';
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
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();

  return (
    <PloRadarChart
      radar={radar}
      size={COMPACT_SIZE}
      title="PLO ที่วิชาของฉันสนับสนุน"
      footer={
        <div className="space-y-4 border-t pt-4">
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
