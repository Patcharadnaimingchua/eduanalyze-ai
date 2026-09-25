'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchStaffOverview, fetchStudentProfiles } from '@/lib/api/staff';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { PageLoadError } from '@/components/layout/page-states';
import { PageSection } from '@/components/layout/page-section';
import { Reveal } from '@/components/layout/reveal';
import { StaffDashboardSummary } from '@/components/staff/staff-dashboard-summary';
import { AtRiskStudentsCard } from '@/components/staff/at-risk-students-card';
import { ProgramOverviewList } from '@/components/staff/program-overview-list';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ListSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function StaffDashboardPage() {
  return (
    <ProtectedRoute>
      <RequireRole role="STAFF">
        <StaffDashboardContent />
      </RequireRole>
    </ProtectedRoute>
  );
}

function StaffDashboardContent() {
  const { user } = useAuth();
  const studentsQuery = useQuery({ queryKey: ['staff-students'], queryFn: fetchStudentProfiles });
  const overviewQuery = useQuery({ queryKey: ['staff-overview'], queryFn: fetchStaffOverview });

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-3">
          <Skeleton className="mx-auto h-10 w-10 rounded-full" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  return (
    <DashboardShell role="STAFF" identityLabel={user.email} fullName={user.fullName}>
      <Reveal index={0}>
        <PageHeader
          title="แดชบอร์ดเจ้าหน้าที่"
          description="ภาพรวมนักศึกษาและหลักสูตรในขอบเขตของคุณ"
        />
      </Reveal>

      <Reveal index={1}>
        {studentsQuery.isLoading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-40" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-9 w-16" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {studentsQuery.isError && <PageLoadError />}
        {studentsQuery.data && <StaffDashboardSummary students={studentsQuery.data} />}
      </Reveal>

      {/* Above the program list: who needs attention comes before what the
          numbers average out to. */}
      {overviewQuery.data && (
        <Reveal index={2}>
          <AtRiskStudentsCard
            students={overviewQuery.data.atRiskStudents}
            summary={overviewQuery.data.atRiskSummary}
          />
        </Reveal>
      )}

      <Reveal index={3}>
        <PageSection
          title="ภาพรวมสาขา/หลักสูตรในความดูแล"
          description="จำนวนนักศึกษา, GPA เฉลี่ย, และวิชาที่ยังไม่มี CLO ต่อหลักสูตร"
        >
          {overviewQuery.isLoading && <ListSkeleton items={3} />}
          {overviewQuery.isError && <PageLoadError />}
          {overviewQuery.data && <ProgramOverviewList programs={overviewQuery.data.programs} />}
        </PageSection>
      </Reveal>
    </DashboardShell>
  );
}
