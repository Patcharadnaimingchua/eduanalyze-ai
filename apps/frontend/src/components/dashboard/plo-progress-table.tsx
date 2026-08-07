import { Fragment } from 'react';
import type { RadarPoint } from '@eduanalyze-ai/shared-types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// Real data — StudentDashboardReport.radar (PLO achievement per Module
// 10). Rendered as a plain progress-bar table, matching what the Figma
// design actually showed in this section (never a chart in the data,
// only visually a bar) — not the AI hexagon radar, see ai-radar-placeholder.tsx.
export function PloProgressTable({ radar }: { radar: RadarPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ความคืบหน้าผลลัพธ์การเรียนรู้ของหลักสูตร (PLO)</CardTitle>
        <CardDescription>คะแนนการประเมินที่รวบรวมและเชื่อมโยงกับเป้าหมายของหลักสูตร</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[1fr_2fr_auto] gap-x-6 gap-y-4 text-sm">
          <span className="font-medium text-muted-foreground">OUTCOME</span>
          <span className="font-medium text-muted-foreground">ACHIEVEMENT LEVEL</span>
          <span className="text-right font-medium text-muted-foreground">SCORE</span>

          {radar.length === 0 && (
            <p className="col-span-3 py-4 text-center text-muted-foreground">
              ยังไม่มีข้อมูล PLO สำหรับหลักสูตรนี้
            </p>
          )}

          {radar.map((plo) => (
            <Fragment key={plo.ploId}>
              <span className="self-center">
                {plo.code}: {plo.name}
              </span>
              <span className="self-center">
                <Progress value={plo.value ?? 0} />
              </span>
              <span className="self-center text-right font-medium">
                {plo.value === null ? 'ไม่มีข้อมูล' : `${Math.round(plo.value)}%`}
              </span>
            </Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
