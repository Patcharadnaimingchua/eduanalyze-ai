import { Card, CardContent } from '@/components/ui/card';
import { Skeleton, StatCardsSkeleton } from '@/components/ui/skeleton';

// Shaped like the real dashboard layout (3 stat cards, radar + credit
// checker row, PLO table) rather than a generic spinner — replaces the
// bare "กำลังโหลดข้อมูล..." text on this page only.
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full" />

      <StatCardsSkeleton count={3} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="mx-auto h-56 w-56 rounded-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <Skeleton className="h-5 w-56" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
