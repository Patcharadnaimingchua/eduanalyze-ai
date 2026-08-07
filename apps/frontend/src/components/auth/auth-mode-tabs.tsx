'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

// Visually the mockup's Login/Register toggle, but backed by real
// navigation — login and register are separate pages (register needs
// far more fields than a toggle-in-place form could hold), not client
// state on one shared component.
export function AuthModeTabs({ active }: { active: 'login' | 'register' }) {
  return (
    <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
      <Link
        href="/login"
        className={cn(
          'flex-1 rounded-md py-2 text-center text-sm font-medium transition',
          active === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500',
        )}
      >
        เข้าสู่ระบบ
      </Link>
      <Link
        href="/register"
        className={cn(
          'flex-1 rounded-md py-2 text-center text-sm font-medium transition',
          active === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500',
        )}
      >
        สมัครสมาชิก
      </Link>
    </div>
  );
}
