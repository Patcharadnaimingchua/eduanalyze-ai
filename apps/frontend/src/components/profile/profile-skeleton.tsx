import { Card, CardContent } from '@/components/ui/card';

function Block({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-100 ${className ?? ''}`} />;
}

export function ProfileSkeleton() {
  return (
    <>
      <Card className="overflow-hidden border-brand-light">
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
          <Block className="h-16 w-16 shrink-0 rounded-2xl sm:h-20 sm:w-20" />
          <div className="space-y-3">
            <Block className="h-4 w-24" />
            <Block className="h-7 w-52" />
            <div className="flex gap-2">
              <Block className="h-7 w-20 rounded-full" />
              <Block className="h-7 w-28 rounded-full" />
            </div>
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <Block className="h-14 w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="flex items-center gap-3">
            <Block className="h-10 w-10" />
            <div className="space-y-2">
              <Block className="h-5 w-32" />
              <Block className="h-4 w-48" />
            </div>
          </div>
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
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
    </>
  );
}
