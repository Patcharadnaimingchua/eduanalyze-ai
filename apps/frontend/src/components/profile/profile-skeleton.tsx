import { Card, CardContent } from '@/components/ui/card';

function Block({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-100 ${className ?? ''}`} />;
}

export function ProfileSkeleton() {
  return (
    <>
      <Card className="overflow-hidden border-brand-light">
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
          <Block className="h-20 w-20 shrink-0 rounded-2xl sm:h-24 sm:w-24" />
          <div className="space-y-3">
            <Block className="h-4 w-24" />
            <Block className="h-7 w-52" />
            <Block className="h-4 w-64 max-w-full" />
            <div className="flex gap-2">
              <Block className="h-7 w-20 rounded-full" />
              <Block className="h-7 w-28 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[3, 5].map((itemCount) => (
          <Card key={itemCount}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Block className="h-10 w-10" />
                <Block className="h-5 w-32" />
                <Block className="h-4 w-48" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: itemCount }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3.5">
                    <Block className="h-9 w-9 shrink-0" />
                    <div className="space-y-2">
                      <Block className="h-3 w-20" />
                      <Block className="h-4 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
