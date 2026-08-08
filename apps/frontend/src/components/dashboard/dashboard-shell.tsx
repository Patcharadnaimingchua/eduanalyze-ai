'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  CalendarRange,
  GraduationCap,
  HelpCircle,
  LayoutGrid,
  LineChart,
  LogOut,
  Network,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string;
}

// Items without an `href` have no page behind them yet — shown per the
// design (so the shell reads as complete) but disabled/unclickable.
const NAV_ITEMS: NavItem[] = [
  { label: 'แดชบอร์ด', icon: LayoutGrid, href: '/dashboard' },
  { label: 'การติดตามผลการเรียน', icon: LineChart, href: '/academic-record' },
  { label: 'การวิเคราะห์ CLO/PLO', icon: Network, href: '/clo-plo-analysis' },
  { label: 'วัดความถนัด', icon: Target },
  { label: 'แผนการเรียน', icon: CalendarRange },
  { label: 'หลักสูตร', icon: BookOpen },
];

export function DashboardShell({
  studentCode,
  fullName,
  children,
}: {
  studentCode: string;
  fullName: string;
  children: React.ReactNode;
}) {
  const { logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="flex w-64 flex-col border-r border-slate-100 p-6">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
            <GraduationCap size={18} className="text-brand-light" />
          </div>
          <div>
            <p className="text-sm font-medium leading-tight text-primary">EduAnalyze</p>
            <p className="text-xs leading-tight text-muted-foreground">Academic Insights</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
            const active = !!href && pathname === href;

            if (href) {
              return (
                <Link
                  key={label}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition',
                    active ? 'bg-brand-light text-brand' : 'text-slate-600 hover:bg-slate-50',
                  )}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            }

            return (
              <button
                key={label}
                type="button"
                disabled
                aria-disabled
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-400 transition"
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col gap-1 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled
            className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-400"
          >
            <HelpCircle size={16} />
            Help Center
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-100 px-8 py-4">
          <div className="flex gap-6 text-sm">
            {['Transcript', 'My Courses', 'Degree Audit'].map((tab) => (
              <span key={tab} className="cursor-not-allowed text-slate-400">
                {tab}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{studentCode}</span>
            <span className="font-medium text-primary">{fullName}</span>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-8">{children}</main>
      </div>
    </div>
  );
}
