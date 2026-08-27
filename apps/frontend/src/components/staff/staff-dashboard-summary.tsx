'use client';

import Link from 'next/link';
import type { StudentProfileSummary } from '@eduanalyze-ai/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Minimal, chart-free landing summary — no dedicated backend dashboard
// endpoint exists for STAFF yet (unlike STUDENT/INSTRUCTOR/curriculum
// dashboards), so this is composed client-side from the already-fetched
// scoped student list rather than a new aggregate endpoint.
export function StaffDashboardSummary({ students }: { students: StudentProfileSummary[] }) {
  const curriculumCount = new Set(students.map((s) => s.curriculumId)).size;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">นักศึกษาในความดูแล</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold text-primary">{students.length}</p>
          <Link href="/staff/students" className="text-sm font-medium text-brand hover:underline">
            ดูทำเนียบนักศึกษา
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">หลักสูตรในความดูแล</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold text-primary">{curriculumCount}</p>
          <Link href="/staff/curriculum" className="text-sm font-medium text-brand hover:underline">
            จัดการข้อมูลหลักสูตร
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
