import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// No real data — see the Student Dashboard plan's Context section.
// Module 7 (GET /ai-analysis/student/:id) returns hedged Thai prose only
// (summary/strengths/weaknesses/recommendations as strings), never
// per-axis numeric scores, and the 6 categories in the Figma mockup
// (การคิดเชิงวิเคราะห์/แก้ปัญหา/สื่อสาร/ภาวะผู้นำ/ทีมเวิร์ก/วิจัย) aren't
// PLO codes either — no endpoint computes them. Placeholder only,
// confirmed with the user rather than inventing numbers.
export function AiRadarPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">วัดศักยภาพด้าน AI</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-200 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light">
            <Sparkles size={18} className="text-brand" />
          </div>
          <p className="font-medium text-primary">เร็วๆ นี้</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            ระบบวิเคราะห์ศักยภาพความถนัดกำลังอยู่ระหว่างการพัฒนา
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
