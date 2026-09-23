import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Mirrors the loaded layout: header, the 2-column planner section, then the
// "what's still missing" section (summary card + elective list).
export function LearningPathSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, col) => (
            <Card key={col}>
              <CardContent className="space-y-2 pt-6">
                <Skeleton className="mb-2 h-5 w-40" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-44" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardContent className="space-y-2 pt-6">
              <Skeleton className="mb-2 h-5 w-48" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
