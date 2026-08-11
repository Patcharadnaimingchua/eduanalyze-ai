'use client';

import { useQuery } from '@tanstack/react-query';
import { Award, FileCheck2, Star } from 'lucide-react';
import type { StudentDashboardResponse } from '@eduanalyze-ai/shared-types';
import { fetchOwnStudentProfile, fetchStudentDashboard } from '@/lib/api/dashboard';
import { useAuth } from '@/lib/auth-context';
import { useCountUp } from '@/lib/use-count-up';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { StatCard } from '@/components/dashboard/stat-card';
import { PloProgressTable } from '@/components/dashboard/plo-progress-table';
import { CreditCheckerPanel } from '@/components/dashboard/credit-checker-panel';
import { PloRadarCard } from '@/components/dashboard/plo-radar-card';
import { Progress } from '@/components/ui/progress';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();

  // Guard before firing any dashboard queries — a non-STUDENT hitting this
  // page (e.g. an instructor testing the pilot) would otherwise get a
  // generic "failed to load" error from fetchOwnStudentProfile() 404ing,
  // which reads as a broken page rather than "wrong page for your role."
  const isStudent = !!user?.roles.includes('STUDENT');

  const profileQuery = useQuery({
    queryKey: ['student-profile-me'],
    queryFn: fetchOwnStudentProfile,
    enabled: isStudent,
  });

  const dashboardQuery = useQuery({
    queryKey: ['student-dashboard', profileQuery.data?.id],
    queryFn: () => fetchStudentDashboard(profileQuery.data!.id),
    enabled: !!profileQuery.data?.id,
  });

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (!isStudent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">หน้านี้สำหรับนักศึกษาเท่านั้น</p>
      </div>
    );
  }

  if (profileQuery.isLoading || dashboardQuery.isLoading) {
    return (
      <DashboardShell studentCode={profileQuery.data?.studentCode ?? ''} fullName={user.fullName}>
        <DashboardSkeleton />
      </DashboardShell>
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
      <DashboardCards fullName={user.fullName} dashboard={dashboard} />
    </DashboardShell>
  );
}

function DashboardCards({
  fullName,
  dashboard,
}: {
  fullName: string;
  dashboard: StudentDashboardResponse;
}) {
  const animatedGpa = useCountUp(dashboard.gpa ?? 0, { duration: 900, decimals: 2 });
  const animatedCredits = useCountUp(dashboard.creditsEarned, { duration: 900, decimals: 0 });
  const animatedProgress = useCountUp(dashboard.curriculumProgressPercent, {
    duration: 900,
    decimals: 0,
  });

  return (
    <>
      <div
        className="animate-in fade-in-0 slide-in-from-bottom-4 rounded-xl bg-brand-light px-6 py-5 duration-500"
        style={{ animationFillMode: 'both' }}
      >
        <h1 className="text-2xl font-semibold text-primary">สวัสดี, {fullName}</h1>
        <p className="text-sm text-muted-foreground">
          แผนการเรียนวิชาการและตัวชี้วัดความพร้อมของคุณ
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: '75ms', animationFillMode: 'both' }}
        >
          <StatCard
            icon={Star}
            label="เกรดเฉลี่ยสะสม"
            value={dashboard.gpa !== null ? animatedGpa.toFixed(2) : '—'}
            suffix="/ 4.0"
          />
        </div>
        <div
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: '150ms', animationFillMode: 'both' }}
        >
          <StatCard
            icon={FileCheck2}
            label="หน่วยกิตสะสม"
            value={Math.round(animatedCredits)}
            suffix={`/ ${dashboard.totalCreditsRequired}`}
            badge={
              dashboard.graduationReadiness.creditsMet
                ? { text: 'On Track', tone: 'positive' }
                : { text: 'ยังไม่ครบ', tone: 'neutral' }
            }
          />
        </div>
        <div
          className="animate-in fade-in-0 slide-in-from-bottom-4 space-y-2 duration-500"
          style={{ animationDelay: '225ms', animationFillMode: 'both' }}
        >
          <StatCard
            icon={Award}
            label="ความพร้อมสำหรับการสำเร็จการศึกษา"
            value={`${Math.round(animatedProgress)}%`}
          />
          <Progress value={animatedProgress} className="mx-1" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: '300ms', animationFillMode: 'both' }}
        >
          <PloRadarCard radar={dashboard.radar} />
        </div>
        <div
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: '375ms', animationFillMode: 'both' }}
        >
          <CreditCheckerPanel courses={dashboard.missingRequiredCourses} />
        </div>
      </div>

      <div
        className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        style={{ animationDelay: '450ms', animationFillMode: 'both' }}
      >
        <PloProgressTable radar={dashboard.radar} />
      </div>
    </>
  );
}
