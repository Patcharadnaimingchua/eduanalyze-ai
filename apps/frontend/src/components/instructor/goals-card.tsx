import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { GoalRow } from '@/lib/instructor-overview';
import { Badge } from '@/components/ui/badge';
import { PageSection } from '@/components/layout/page-section';

// Up to five learning goals, the ones not met first. The backend works out one
// share per course, so a goal is only "met" or "not yet": no per-goal percent
// is shown, and the note under the list says so.
export function GoalsCard({
  rows,
  unmet,
  total,
}: Readonly<{ rows: GoalRow[]; unmet: number; total: number }>) {
  if (total === 0) return null;
  return (
    <PageSection
      title="เป้าการเรียนรู้"
      description={
        unmet > 0
          ? `ยังไม่ถึงเป้า ${unmet} จาก ${total} ข้อ · เป้าการเรียนรู้ (CLO) คือสิ่งที่นักศึกษาควรทำได้เมื่อเรียนจบวิชา`
          : `ผ่านเป้าครบทั้ง ${total} ข้อ`
      }
    >
      <ul className="divide-y rounded-xl border bg-card">
        {rows.map((r) => (
          <li key={`${r.courseId}-${r.cloCode}`}>
            <Link
              href={`/instructor/courses/${r.courseId}?tab=clo`}
              className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">
                  {r.courseCode} {r.courseName} · {r.cloCode}
                </span>
                <span className="block text-primary">{r.description}</span>
              </span>
              <Badge tone={r.met ? 'success' : 'danger'} className="gap-1 px-2.5 py-1 text-sm">
                {r.met ? <CheckCircle2 size={14} aria-hidden="true" /> : <XCircle size={14} aria-hidden="true" />}
                {r.met ? 'ผ่านเป้า' : 'ยังไม่ถึงเป้า'}
              </Badge>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        ผ่านหรือไม่ดูจากสัดส่วนคนที่ได้ B ขึ้นไปของทั้งวิชา เทียบกับเป้าของแต่ละข้อ ไม่ได้คิดแยกรายข้อ
        {total > rows.length && ` · แสดง ${rows.length} จาก ${total} ข้อ`}
      </p>
    </PageSection>
  );
}
