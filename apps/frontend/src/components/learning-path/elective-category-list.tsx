import { Info } from 'lucide-react';
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
              ) : hasCatalog ? (
                <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-muted-foreground">
                  มีวิชาในหมวดนี้ แต่ยังไม่มีวิชาที่ลงทะเบียนได้ในขณะนี้
                </p>
              ) : (
                // Free Elective / some Gen Ed groups are university-wide by
                // design (PROJECT_CONTEXT.md's "generic across programs"
                // principle) — too many courses across every faculty to
                // import into this system, decided at Phase 4. This is
                // expected, not missing data, so the copy explains why
                // instead of reading like a broken/incomplete page.
                <div className="flex items-start gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-muted-foreground">
                  <Info size={16} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                  <p>
                    หมวดนี้ยังขาดอีก {category.creditsShort} หน่วยกิต — เลือกได้จากทุกคณะทั่วมหาวิทยาลัย
                    ระบบยังไม่มีรายชื่อวิชาให้แนะนำในหมวดนี้ ติดต่อฝ่ายทะเบียนหรือเลือกจากรายวิชาเปิดสอนในระบบทะเบียนกลาง
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
