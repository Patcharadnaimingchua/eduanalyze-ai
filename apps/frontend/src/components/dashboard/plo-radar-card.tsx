import Link from 'next/link';
import type { RadarPoint } from '@eduanalyze-ai/shared-types';
import { PloRadarChart } from '@/components/aptitude-analysis/plo-radar-chart';
import { Button } from '@/components/ui/button';

const COMPACT_SIZE = 220;

// Real PLO data — StudentDashboardReport.radar, already loaded by this
// page for PloProgressTable further down, same values /aptitude-analysis
// shows at full size. Replaces the old AI radar placeholder now that a
// real (non-AI) radar exists — title matches /aptitude-analysis's own
// title so the card-to-page link reads consistently.
export function PloRadarCard({ radar }: { radar: RadarPoint[] }) {
  return (
    <div className="space-y-3">
      <PloRadarChart radar={radar} size={COMPACT_SIZE} title="วัดความถนัด" />
      <Link href="/aptitude-analysis">
        <Button type="button" variant="outline" className="w-full">
          ดูรายละเอียด
        </Button>
      </Link>
    </div>
  );
}
