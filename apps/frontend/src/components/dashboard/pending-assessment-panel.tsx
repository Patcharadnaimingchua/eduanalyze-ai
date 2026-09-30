import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function PendingAssessmentPanel({ count }: Readonly<{ count: number }>) {
  if (count <= 0) return null;

  return (
    <Card className="border-amber-200">
      <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-primary">ยังไม่ได้ประเมินตนเอง {count} รายวิชา</p>
            <p className="text-xs text-muted-foreground">
              การประเมินตนเองเป็นข้อมูลเสริม ไม่แทนที่ผลลัพธ์จากเกรด
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/academic-record">ไปประเมินที่ประวัติการเรียน</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
