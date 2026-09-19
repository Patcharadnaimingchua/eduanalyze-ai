'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, GraduationCap, Users } from 'lucide-react';
import { fetchSystemCurriculumOverview } from '@/lib/api/admin';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { BelowThresholdLists } from '@/components/admin/below-threshold-lists';
import { CurriculumComparisonChart } from '@/components/admin/curriculum-comparison-chart';
import { SystemCurriculumList } from '@/components/admin/system-curriculum-list';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

// Comparing one curriculum against nothing is not a comparison, so the
// chart needs at least two with real enrolment — same bar the instructor
// dashboard applies to its course chart.
const MIN_CURRICULA_TO_COMPARE = 2;

export default function CurriculumDashboardPage() {
  return (
    <ProtectedRoute>
      <RequireRole role="SUPER_ADMIN">
        <CurriculumDashboardContent />
      </RequireRole>
    </ProtectedRoute>
  );
}

function CurriculumDashboardContent() {
  const { user } = useAuth();
  const overviewQuery = useQuery({
    queryKey: ['system-curriculum-overview'],
    queryFn: fetchSystemCurriculumOverview,
  });

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const data = overviewQuery.data;
  const comparable = (data?.curricula ?? []).filter(
    (curriculum) => curriculum.dataState === 'HAS_STUDENTS',
  );

  return (
    <DashboardShell role="SUPER_ADMIN" identityLabel={user.email} fullName={user.fullName}>
      <div>
        <h1 className="text-2xl font-semibold text-primary">ภาพรวมหลักสูตรทั้งระบบ</h1>
        <p className="text-sm text-muted-foreground">
          นักศึกษา ผลสัมฤทธิ์ PLO และจุดที่ต่ำกว่าเกณฑ์ ข้ามทุกหลักสูตรในสถาบัน
        </p>
      </div>

      {overviewQuery.isLoading && (
        <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>
      )}
      {overviewQuery.isError && (
        <Alert variant="destructive">
          <AlertDescription>ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              icon={Users}
              label="นักศึกษาทั้งหมด"
              value={data.totals.studentCount}
              suffix="คน"
            />
            <StatCard
              icon={GraduationCap}
              label="พร้อมสำเร็จการศึกษา"
              value={data.totals.graduationReadyCount}
              suffix="คน"
              badge={
                data.totals.graduationReadyPercent === null
                  ? undefined
                  : {
                      text: `${Math.round(data.totals.graduationReadyPercent)}%`,
                      tone: data.totals.graduationReadyCount > 0 ? 'positive' : 'neutral',
                    }
              }
            />
            <StatCard
              icon={AlertTriangle}
              label="นักศึกษากลุ่มเสี่ยง (GPA ต่ำกว่า 2.00)"
              value={data.totals.studentsAtRiskCount}
              suffix="คน"
            />
          </div>

          <p className="text-sm text-muted-foreground">
            มีข้อมูลผลการเรียนจริง {data.totals.curriculaWithStudentsCount} จาก{' '}
            {data.totals.curriculumCount} หลักสูตร
          </p>

          <BelowThresholdLists
            plos={data.problematicPlos}
            clos={data.problematicClos}
          />

          {comparable.length >= MIN_CURRICULA_TO_COMPARE ? (
            <CurriculumComparisonChart curricula={comparable} threshold={null} />
          ) : (
            <Card>
              <CardContent className="py-6">
                <p className="text-sm text-muted-foreground">
                  ต้องมีอย่างน้อย {MIN_CURRICULA_TO_COMPARE}{' '}
                  หลักสูตรที่มีนักศึกษาจึงจะเปรียบเทียบกันได้ — ขณะนี้มี{' '}
                  {comparable.length} หลักสูตร
                </p>
              </CardContent>
            </Card>
          )}

          <SystemCurriculumList curricula={data.curricula} />
        </>
      )}
    </DashboardShell>
  );
}
