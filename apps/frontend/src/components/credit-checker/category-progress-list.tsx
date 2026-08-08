import type { CategoryProgress } from '@eduanalyze-ai/shared-types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function CategoryProgressList({ categories }: { categories: CategoryProgress[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ความคืบหน้าตามหมวดวิชา</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.length === 0 && (
          <p className="text-center text-muted-foreground">ยังไม่มีข้อมูลหมวดวิชา</p>
        )}
        {categories.map((category) => (
          <div key={category.categoryId} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-primary">{category.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
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
              value={category.minCredits > 0 ? (category.creditsEarned / category.minCredits) * 100 : 0}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
