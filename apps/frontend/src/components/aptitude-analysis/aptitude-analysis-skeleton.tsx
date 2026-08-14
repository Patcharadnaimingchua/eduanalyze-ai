import { Card, CardContent } from '@/components/ui/card';

function Block({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-100 ${className ?? ''}`} />;
}

// Shaped like the real side-by-side layout (radar + interpretation card)
// rather than a generic spinner — same Block pattern as
// dashboard-skeleton.tsx, replaces the bare "กำลังโหลดข้อมูล..." text.
export function AptitudeAnalysisSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardContent className="flex items-center justify-center py-10">
          <Block className="h-56 w-56 rounded-full" />
        </CardContent>
      </Card>
      <Card className="lg:col-span-3">
        <CardContent className="space-y-4 pt-6">
          <Block className="h-5 w-40" />
          <Block className="h-4 w-full" />
          <div className="space-y-2">
            <Block className="h-4 w-24" />
            <Block className="h-4 w-full" />
            <Block className="h-4 w-5/6" />
          </div>
          <div className="space-y-2">
            <Block className="h-4 w-32" />
            <Block className="h-4 w-full" />
            <Block className="h-4 w-4/6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
