import { Card, CardContent } from '@/components/ui/card';

function Block({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-100 ${className ?? ''}`} />;
}

// Shaped like the real layout (single card, 8 label/value rows) rather
// than a generic spinner — same Block pattern as dashboard-skeleton.tsx /
// aptitude-analysis-skeleton.tsx / learning-path-skeleton.tsx, replaces
// the bare "กำลังโหลดข้อมูล..." text.
export function ProfileSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between border-b border-slate-50 py-1 last:border-b-0">
            <Block className="h-4 w-24" />
            <Block className="h-4 w-40" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
