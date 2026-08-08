import type { IncompleteElectiveCategory } from '@eduanalyze-ai/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ElectiveCategoryList({
  categories,
  courseCountByCategory,
}: {
  categories: IncompleteElectiveCategory[];
  courseCountByCategory: Map<string, number>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">หมวดวิชาเลือกที่ยังไม่ครบ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.length === 0 && (
          <p className="text-center text-muted-foreground">คุณผ่านหมวดวิชาเลือกครบตามเกณฑ์แล้ว</p>
        )}
        {categories.map((category) => {
          const hasCatalog = (courseCountByCategory.get(category.categoryId) ?? 0) > 0;

          return (
            <div key={category.categoryId} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-primary">{category.name}</span>
                <span className="text-muted-foreground">
                  {category.creditsEarned} / {category.minCredits} หน่วยกิต (ขาด {category.creditsShort})
                </span>
              </div>

              {category.availableElectivesInCategory.length > 0 ? (
                <div className="space-y-2">
                  {category.availableElectivesInCategory.map((course) => (
                    <div
                      key={course.courseId}
                      className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                    >
                      <p className="text-sm font-medium text-primary">
                        {course.code}: {course.name}
                      </p>
                      <span className="text-xs text-muted-foreground">{course.credits} หน่วยกิต</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-muted-foreground">
                  {hasCatalog
                    ? 'มีวิชาในหมวดนี้ แต่ยังไม่มีวิชาที่ลงทะเบียนได้ในขณะนี้'
                    : 'ยังไม่มีข้อมูลวิชาแนะนำในหมวดนี้'}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
