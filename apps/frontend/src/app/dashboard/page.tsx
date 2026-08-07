'use client';

import { useQuery } from '@tanstack/react-query';
import { Award, FileCheck2, Star } from 'lucide-react';
import { fetchOwnStudentProfile, fetchStudentDashboard } from '@/lib/api/dashboard';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { PloProgressTable } from '@/components/dashboard/plo-progress-table';
import { CreditCheckerPanel } from '@/components/dashboard/credit-checker-panel';
import { AiRadarPlaceholder } from '@/components/dashboard/ai-radar-placeholder';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();

  const profileQuery = useQuery({
    queryKey: ['student-profile-me'],
    queryFn: fetchOwnStudentProfile,
  });

  const dashboardQuery = useQuery({
    queryKey: ['student-dashboard', profileQuery.data?.id],
    queryFn: () => fetchStudentDashboard(profileQuery.data!.id),
    enabled: !!profileQuery.data?.id,
  });

  if (profileQuery.isLoading || dashboardQuery.isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (profileQuery.isError || dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">ไม่สามารถโหลดข้อมูลแดชบอร์ดได้ กรุณาลองใหม่อีกครั้ง</p>
      </div>
    );
  }

  const dashboard = dashboardQuery.data;

  return (
    <DashboardShell studentCode={profileQuery.data?.studentCode ?? ''} fullName={user.fullName}>
      <div>
        <h1 className="text-2xl font-semibold text-primary">ภาพรวม</h1>
        <p className="text-sm text-muted-foreground">
          แผนการเรียนวิชาการและตัวชี้วัดความพร้อมของคุณ
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          icon={Star}
          label="เกรดเฉลี่ยสะสม"
          value={dashboard.gpa !== null ? dashboard.gpa.toFixed(2) : '—'}
          suffix="/ 4.0"
        />
        <StatCard
          icon={FileCheck2}
          label="หน่วยกิตสะสม"
          value={dashboard.creditsEarned}
          suffix={`/ ${dashboard.totalCreditsRequired}`}
          badge={
            dashboard.graduationReadiness.creditsMet
              ? { text: 'On Track', tone: 'positive' }
              : { text: 'ยังไม่ครบ', tone: 'neutral' }
          }
        />
        <StatCard
          icon={Award}
          label="ความพร้อมสำหรับการสำเร็จการศึกษา"
          value={`${Math.round(dashboard.curriculumProgressPercent)}%`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AiRadarPlaceholder />
        <CreditCheckerPanel courses={dashboard.missingRequiredCourses} />
      </div>

      <PloProgressTable radar={dashboard.radar} />
    </DashboardShell>
  );
}
