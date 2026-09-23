import { Card, CardContent } from '@/components/ui/card';
import { Skeleton, StatCardsSkeleton } from '@/components/ui/skeleton';

// Mirrors the loaded layout: header, 3 stat cards, then the "next steps"
// and PLO sections, so nothing jumps when data arrives.
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>

      <StatCardsSkeleton count={3} />

      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-5 w-56" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-52" />
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="mx-auto h-64 w-64 rounded-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
