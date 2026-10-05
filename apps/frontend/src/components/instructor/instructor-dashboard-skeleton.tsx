import { Card, CardContent } from '@/components/ui/card';
import { ListSkeleton, Skeleton, StatCardsSkeleton } from '@/components/ui/skeleton';

function CardRow({ children }: { children: (i: number) => React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="space-y-3 pt-6">{children(i)}</CardContent>
        </Card>
      ))}
    </div>
  );
}

// Shaped like the real layouts rather than a generic spinner — same
// approach as dashboard-skeleton.tsx. First row reuses StatCardsSkeleton
// (was a hand-duplicated CardRow with the exact same icon+label+number
// shape) — second row has no shared equivalent, stays a custom CardRow.
export function InstructorDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <StatCardsSkeleton count={4} className="md:grid-cols-2 xl:grid-cols-4" />
      {/* Follow-up list, then the course grid — same order as the loaded page. */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Skeleton className="h-5 w-40" />
          <ListSkeleton items={3} />
        </CardContent>
      </Card>
      <CardRow>
        {() => (
          <>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </>
        )}
      </CardRow>
      {/* Collapsed CLO and in-depth bars. */}
      <Skeleton className="h-14 w-full rounded-lg" />
      <Skeleton className="h-14 w-full rounded-lg" />
    </div>
  );
}

// Course-card-grid placeholder for pages whose only content is
// InstructorCourseGrid (e.g. My Courses) — matches InstructorCourseCard's
// shape (code+name, then a stat line) rather than reusing
// InstructorDashboardSkeleton's stat-card-shaped first row, which doesn't
// resemble a course card.
export function InstructorCourseGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="space-y-2 pt-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Stacked-section placeholder for InstructorCourseTimeline (My Courses'
// grouped-by-year/semester view) — doesn't reuse InstructorCourseGridSkeleton
// above, whose grid-of-cards shape doesn't match this page's sectioned list.
export function InstructorCourseTimelineSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 2 }).map((_, yearIndex) => (
        <div key={yearIndex} className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="space-y-2 rounded-md border border-slate-200 p-3">
              {Array.from({ length: 3 }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex items-center justify-between gap-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Mirrors InstructorDetailPanel's layout: a header bar outside the Card
// (now PageHeader — course name/code), then a Card holding the tab-strip
// pills and the active tab's content block.
export function InstructorCourseSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex gap-4">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-6 w-28" />
          </div>
          <Skeleton className="h-56 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
