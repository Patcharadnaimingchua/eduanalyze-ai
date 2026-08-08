import { ClipboardList } from 'lucide-react';
import type { PloInterpretation } from '@/lib/interpret-plo-radar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function BulletList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-primary">{title}</p>
      <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

// Rule-based, deterministic text derived from the real PLO numbers
// (interpret-plo-radar.ts) — no AI call, no cost. Named/headed to reflect
// that honestly, not "AI" (same principle already applied to
// credit-checker-panel.tsx's copy for its own deterministic output).
export function PloInterpretationCard({ report }: { report: PloInterpretation }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList size={16} className="text-brand" />
          สรุปผลการประเมิน
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{report.summary}</p>
        <BulletList title="จุดแข็ง" items={report.strengths} />
        <BulletList title="จุดที่ควรพัฒนา" items={report.weaknesses} />
        <BulletList title="คำแนะนำ" items={report.recommendations} />
      </CardContent>
    </Card>
  );
}
