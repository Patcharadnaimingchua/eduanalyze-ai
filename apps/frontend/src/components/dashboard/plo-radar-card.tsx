'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { RadarPoint } from '@eduanalyze-ai/shared-types';
import { cn } from '@/lib/utils';
import { PloRadarChart } from '@/components/aptitude-analysis/plo-radar-chart';
import { Button } from '@/components/ui/button';
import { PloProgressTable } from './plo-progress-table';

const COMPACT_SIZE = 260;

export function PloRadarCard({ radar }: Readonly<{ radar: RadarPoint[] }>) {
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();

  return (
    <PloRadarChart
      radar={radar}
      size={COMPACT_SIZE}
      title="คะแนนเฉลี่ยราย PLO (เต็ม 5)"
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
