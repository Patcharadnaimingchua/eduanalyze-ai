'use client';

import Link from 'next/link';
import { BookOpen, Users } from 'lucide-react';
import type { StudentProfileSummary } from '@eduanalyze-ai/shared-types';
import { StatCard } from '@/components/dashboard/stat-card';

// Minimal, chart-free landing summary, counted client-side off the
// scoped student list the page already holds. GET /dashboard/staff does
// exist and the same page calls it, but it aggregates per curriculum —
// these two totals are cheaper to derive here than to add to it.
export function StaffDashboardSummary({ students }: { students: StudentProfileSummary[] }) {
  const curriculumCount = new Set(students.map((s) => s.curriculumId)).size;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <StatCard
        icon={Users}
        label="นักศึกษาในความดูแล"
        value={students.length}
        footer={
          <Link href="/staff/students" className="text-sm font-medium text-brand hover:underline">
            ดูทำเนียบนักศึกษา
          </Link>
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
