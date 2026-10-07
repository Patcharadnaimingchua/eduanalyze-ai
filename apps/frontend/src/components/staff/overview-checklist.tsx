import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Info,
  MinusCircle,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ChecklistItem {
  key: string;
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { href: string; label: string };
}

export const CHECK_ICONS = {
  noData: MinusCircle,
  critical: AlertTriangle,
  noInstructor: UserX,
  noClo: BookOpen,
};

// Rows with a count of zero are not passed in, so an empty list means there is
// nothing to check. A row without an action is information only: it names
// something Staff cannot fix themselves.
export function OverviewChecklist({ items }: Readonly<{ items: ChecklistItem[] }>) {
  const actionable = items.filter((item) => item.action).length;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="text-lg">สิ่งที่ควรตรวจสอบ</CardTitle>
          {actionable > 0 && (
            <span className="inline-flex min-h-7 items-center gap-1.5 rounded border border-red-200 bg-red-50 px-2.5 text-xs font-semibold tabular-nums text-red-700">
              <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
              {actionable} รายการรอดำเนินการ
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">ไม่มีรายการที่ต้องตรวจสอบในขอบเขตนี้</p>
        ) : (
          <ul className="space-y-2">
            {items.map(({ key, icon: Icon, title, description, action }) => (
              <li
                key={key}
                className="flex flex-col gap-3 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light">
                    <Icon aria-hidden="true" size={18} className="text-brand" />
                  </span>
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-primary">{title}</p>
                    <p className="break-words text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
                {action ? (
                  <Link
                    href={action.href}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded border border-slate-300 bg-card px-4 text-sm font-semibold text-primary hover:bg-slate-100"
                  >
                    {action.label}
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <Info aria-hidden="true" className="h-3.5 w-3.5" />
                    ข้อมูลเพื่อทราบ
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
