import { Card, CardContent } from '@/components/ui/card';

function Block({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-100 ${className ?? ''}`} />;
}

// Shaped like the real layout (stat card row + 2-column planner) rather
// than a generic spinner — same Block pattern as dashboard-skeleton.tsx /
// aptitude-analysis-skeleton.tsx, replaces the bare "กำลังโหลดข้อมูล..." text.
export function LearningPathSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Block className="h-9 w-9 rounded-lg" />
            <Block className="h-4 w-32" />
            <Block className="h-8 w-16" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, col) => (
          <Card key={col}>
            <CardContent className="space-y-2 pt-6">
              <Block className="mb-2 h-5 w-40" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Block key={i} className="h-14 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
