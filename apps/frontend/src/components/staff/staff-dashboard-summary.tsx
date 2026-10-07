'use client';

import Link from 'next/link';
import { BookOpen, Users } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { activeStudents, countStudents } from './student-counts';

// Minimal, chart-free landing summary, counted client-side off the
// scoped student list the page already holds. GET /dashboard/staff does
// exist and the same page calls it, but it aggregates per curriculum —
// these two totals are cheaper to derive here than to add to it.
//
// Suspended students are left out of both totals, matching the year-level
// page and the per-curriculum overview, and reported on their own line.
export function StaffDashboardSummary({
  students,
}: {
  students: { isActive: boolean; curriculumId: string }[];
}) {
  const counts = countStudents(students);
  const curriculumCount = new Set(activeStudents(students).map((s) => s.curriculumId)).size;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <StatCard
        icon={Users}
        label="นักศึกษาในความดูแล"
        value={counts.active}
        footer={
          <div className="space-y-1">
            {counts.suspended > 0 && (
              <p className="text-xs text-muted-foreground">ระงับ {counts.suspended} คน (ไม่นับรวม)</p>
            )}
            <Link href="/staff/students" className="text-sm font-medium text-brand hover:underline">
              ดูทำเนียบนักศึกษา
            </Link>
          </div>
        }
      />

      <StatCard
        icon={BookOpen}
        label="หลักสูตรในความดูแล"
        value={curriculumCount}
        footer={
          <Link href="/staff/curriculum" className="text-sm font-medium text-brand hover:underline">
            จัดการข้อมูลหลักสูตร
          </Link>
        }
      />
    </div>
  );
}
