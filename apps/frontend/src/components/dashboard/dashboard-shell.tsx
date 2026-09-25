'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Building2,
  CalendarClock,
  CalendarRange,
  GraduationCap,
  LayoutGrid,
  LineChart,
  ListChecks,
  LogOut,
  Menu,
  Network,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@eduanalyze-ai/shared-types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

const STUDENT_NAV_ITEMS: NavItem[] = [
  { label: 'แดชบอร์ด', icon: LayoutGrid, href: '/dashboard' },
  { label: 'การติดตามผลการเรียน', icon: LineChart, href: '/academic-record' },
  { label: 'ตรวจสอบหน่วยกิต', icon: ListChecks, href: '/credit-checker' },
  { label: 'การวิเคราะห์ CLO/PLO', icon: Network, href: '/clo-plo-analysis' },
  { label: 'วัดความถนัด', icon: Target, href: '/aptitude-analysis' },
  { label: 'แผนการเรียน', icon: CalendarRange, href: '/learning-path' },
];

const INSTRUCTOR_NAV_ITEMS: NavItem[] = [
  { label: 'แดชบอร์ด', icon: LayoutGrid, href: '/instructor/dashboard' },
  { label: 'รายวิชาที่สอน', icon: BookOpen, href: '/instructor/my-courses' },
  { label: 'นักศึกษา', icon: Users, href: '/instructor/students' },
  { label: 'ภาพรวมชั้นปี', icon: GraduationCap, href: '/instructor/year-levels' },
];

// SUPER_ADMIN-only pages (e.g. academic-years) don't belong in plain
// ADMIN's nav — the two used to be lumped into one array, which would have
// shown ADMIN a link into a page RequireRole immediately blocks them from.
const SUPER_ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'ภาพรวมหลักสูตร', icon: LayoutGrid, href: '/admin/curriculum-dashboard' },
  { label: 'ผู้ใช้งาน', icon: Users, href: '/admin/users' },
  { label: 'โครงสร้างองค์กร', icon: Building2, href: '/admin/organization' },
  { label: 'ปีการศึกษา', icon: CalendarClock, href: '/admin/academic-years' },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'ผู้ใช้งาน', icon: Users, href: '/admin/users' },
];

const STAFF_NAV_ITEMS: NavItem[] = [
  { label: 'แดชบอร์ด', icon: LayoutGrid, href: '/staff/dashboard' },
  { label: 'ทำเนียบนักศึกษา', icon: Users, href: '/staff/students' },
  { label: 'ข้อมูลหลักสูตร', icon: BookOpen, href: '/staff/curriculum' },
];

function navItemsForRole(role: Role): NavItem[] {
  if (role === 'INSTRUCTOR') return INSTRUCTOR_NAV_ITEMS;
  if (role === 'SUPER_ADMIN') return SUPER_ADMIN_NAV_ITEMS;
  if (role === 'ADMIN') return ADMIN_NAV_ITEMS;
  if (role === 'STAFF') return STAFF_NAV_ITEMS;
  return STUDENT_NAV_ITEMS;
}

export function DashboardShell({
  studentCode,
  identityLabel,
  fullName,
  role = 'STUDENT',
  children,
}: {
  studentCode?: string;
  // Generic identity label shown next to fullName in the header — use this
  // for roles that have no student-code equivalent (e.g. instructor email).
  identityLabel?: string;
  fullName: string;
  role?: Role;
  children: React.ReactNode;
}) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const navItems = navItemsForRole(role);
  const shownIdentity = identityLabel ?? studentCode;
  const [drawerOpen, setDrawerOpen] = useState(false);

  // A nav link inside the drawer should dismiss it, not leave it open over
  // the newly-navigated page.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const sidebarContent = (
    <>
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
        {navItems.map(({ label, icon: Icon, href }) => {
          // Per-course pages have no nav entry of their own — keep the
          // instructor overview highlighted while inside one.
          const active =
            pathname === href ||
            (href === '/instructor/dashboard' && pathname.startsWith('/instructor/courses/'));

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
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="hidden w-64 flex-col border-r border-slate-100 p-6 md:flex">
        {sidebarContent}
      </aside>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="md:hidden">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-4 md:justify-end md:px-8">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-50 md:hidden"
            aria-label="เปิดเมนู"
          >
            <Menu size={20} />
          </button>
          <Link href="/profile" className="flex items-center gap-3 text-sm hover:opacity-80">
            {shownIdentity && <span className="text-muted-foreground">{shownIdentity}</span>}
            <span className="font-medium text-primary">{fullName}</span>
          </Link>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
