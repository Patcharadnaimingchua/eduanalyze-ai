'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchStudentProfiles } from '@/lib/api/staff';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { StaffDashboardSummary } from '@/components/staff/staff-dashboard-summary';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <DashboardShell role="STAFF" identityLabel={user.email} fullName={user.fullName}>
      <div>
        <h1 className="text-2xl font-semibold text-primary">แดชบอร์ดเจ้าหน้าที่</h1>
        <p className="text-sm text-muted-foreground">ภาพรวมนักศึกษาและหลักสูตรในขอบเขตของคุณ</p>
      </div>

      {studentsQuery.isLoading && <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>}
      {studentsQuery.isError && (
        <Alert variant="destructive">
          <AlertDescription>ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</AlertDescription>
        </Alert>
      )}
      {studentsQuery.data && <StaffDashboardSummary students={studentsQuery.data} />}
    </DashboardShell>
  );
}
