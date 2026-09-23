import { Layers } from 'lucide-react';
import type { CategoryProgress } from '@eduanalyze-ai/shared-types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';

export function CategoryProgressList({ categories }: Readonly<{ categories: CategoryProgress[] }>) {
  return (
    <Card>
      <CardContent className="pt-6">
        {categories.length === 0 ? (
          <EmptyState icon={Layers} description="ยังไม่มีข้อมูลหมวดวิชา" />
        ) : (
          <ul className="grid grid-cols-1 gap-x-10 gap-y-5 lg:grid-cols-2">
            {categories.map((category) => (
              <li key={category.categoryId} className="space-y-1.5">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 text-sm">
                  <span className="min-w-0 font-medium text-primary">{category.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-muted-foreground">
                      {category.creditsEarned} / {category.minCredits} หน่วยกิต
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        category.isComplete
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {category.isComplete ? 'ครบแล้ว' : 'ยังไม่ครบ'}
                    </span>
                  </div>
                </div>
                <Progress
                  label={category.name}
                  value={category.minCredits > 0 ? (category.creditsEarned / category.minCredits) * 100 : 0}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
