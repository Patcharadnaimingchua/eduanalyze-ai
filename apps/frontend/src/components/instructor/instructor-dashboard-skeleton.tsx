import { Card, CardContent } from '@/components/ui/card';

function Block({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-100 ${className ?? ''}`} />;
}

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
// approach as dashboard-skeleton.tsx.
export function InstructorDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <CardRow>
        {() => (
          <>
            <Block className="h-9 w-9" />
            <Block className="h-4 w-28" />
            <Block className="h-8 w-16" />
          </>
        )}
      </CardRow>
      <CardRow>
        {() => (
          <>
            <Block className="h-4 w-16" />
            <Block className="h-5 w-40" />
            <Block className="h-4 w-24" />
          </>
        )}
      </CardRow>
    </div>
  );
}

export function InstructorCourseSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <Block className="h-5 w-56" />
        <div className="flex gap-4">
          <Block className="h-6 w-28" />
          <Block className="h-6 w-28" />
          <Block className="h-6 w-28" />
        </div>
        <Block className="h-56 w-full" />
      </CardContent>
    </Card>
  );
}
