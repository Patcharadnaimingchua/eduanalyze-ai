import { Card, CardContent } from '@/components/ui/card';

function Block({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-100 ${className ?? ''}`} />;
}

// Shaped like the real dashboard layout (3 stat cards, radar + credit
// checker row, PLO table) rather than a generic spinner — replaces the
// bare "กำลังโหลดข้อมูล..." text on this page only.
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Block className="h-20 w-full" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-3 pt-6">
              <Block className="h-9 w-9 rounded-lg" />
              <Block className="h-4 w-24" />
              <Block className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <Block className="mx-auto h-56 w-56 rounded-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Block className="h-5 w-40" />
            <Block className="h-16 w-full" />
            <Block className="h-16 w-full" />
            <Block className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <Block className="h-5 w-56" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Block key={i} className="h-6 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
