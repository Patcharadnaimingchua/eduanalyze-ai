import { Sparkles } from 'lucide-react';
import type { AiSkillAnalysisReport } from '@eduanalyze-ai/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

// Explicitly headed as AI interpretation, kept visually/structurally
// separate from PloRadarChart (real, deterministic numbers) — this card
// only ever renders the model's qualitative output verbatim, never
// derives or displays a number from it.
export function AiInterpretationCard({
  report,
  isLoading,
  isError,
}: {
  report: AiSkillAnalysisReport | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles size={16} className="text-brand" />
          การตีความโดย AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p className="text-sm text-muted-foreground">กำลังวิเคราะห์...</p>}
        {!isLoading && isError && (
          <Alert>
            <AlertDescription>บริการวิเคราะห์ด้วย AI ยังไม่พร้อมใช้งานในขณะนี้ กรุณาลองใหม่ภายหลัง</AlertDescription>
          </Alert>
        )}
        {!isLoading && !isError && report && (
          <>
            <p className="text-sm text-muted-foreground">{report.summary}</p>
            <BulletList title="จุดแข็ง" items={report.strengths} />
            <BulletList title="จุดที่ควรพัฒนา" items={report.weaknesses} />
            <BulletList title="คำแนะนำ" items={report.recommendations} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
