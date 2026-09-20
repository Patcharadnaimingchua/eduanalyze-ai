'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchStaffOverview, fetchStudentProfiles } from '@/lib/api/staff';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { StaffDashboardSummary } from '@/components/staff/staff-dashboard-summary';
import { AtRiskStudentsCard } from '@/components/staff/at-risk-students-card';
import { ProgramOverviewList } from '@/components/staff/program-overview-list';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
      <div>
        <h1 className="text-2xl font-semibold text-primary">แดชบอร์ดเจ้าหน้าที่</h1>
        <p className="text-sm text-muted-foreground">ภาพรวมนักศึกษาและหลักสูตรในขอบเขตของคุณ</p>
      </div>

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
      {studentsQuery.isError && (
        <Alert variant="destructive">
          <AlertDescription>ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</AlertDescription>
        </Alert>
      )}
      {studentsQuery.data && <StaffDashboardSummary students={studentsQuery.data} />}

      {/* Above the program list: who needs attention comes before what the
          numbers average out to. */}
      {overviewQuery.data && (
        <AtRiskStudentsCard
          students={overviewQuery.data.atRiskStudents}
          summary={overviewQuery.data.atRiskSummary}
        />
      )}

      <div>
        <h2 className="text-lg font-semibold text-primary">ภาพรวมสาขา/หลักสูตรในความดูแล</h2>
        <p className="text-sm text-muted-foreground">
          จำนวนนักศึกษา, GPA เฉลี่ย, และวิชาที่ยังไม่มี CLO ต่อหลักสูตร
        </p>
      </div>
      {overviewQuery.isLoading && <ListSkeleton items={3} />}
      {overviewQuery.isError && (
        <Alert variant="destructive">
          <AlertDescription>ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</AlertDescription>
        </Alert>
      )}
      {overviewQuery.data && <ProgramOverviewList programs={overviewQuery.data.programs} />}
    </DashboardShell>
  );
}
