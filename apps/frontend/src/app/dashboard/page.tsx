'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Award, FileCheck2, Star } from 'lucide-react';
import type { StudentDashboardResponse } from '@eduanalyze-ai/shared-types';
import { fetchOwnStudentProfile, fetchStudentDashboard } from '@/lib/api/dashboard';
import { useAuth } from '@/lib/auth-context';
import { useCountUp } from '@/lib/use-count-up';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { PageSection } from '@/components/layout/page-section';
import { Reveal } from '@/components/layout/reveal';
import { PageLoadError, StudentOnlyPage } from '@/components/layout/page-states';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { StatCard } from '@/components/dashboard/stat-card';
import { CreditCheckerPanel } from '@/components/dashboard/credit-checker-panel';
import { PloRadarCard } from '@/components/dashboard/plo-radar-card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

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
        <div className="space-y-3">
          <Skeleton className="mx-auto h-10 w-10 rounded-full" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  if (!isStudent) {
    return <StudentOnlyPage user={user} />;
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
      <DashboardShell studentCode={profileQuery.data?.studentCode ?? ''} fullName={user.fullName}>
        <PageLoadError message="ไม่สามารถโหลดข้อมูลแดชบอร์ดได้ กรุณาลองใหม่อีกครั้ง" />
      </DashboardShell>
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
}: Readonly<{
  fullName: string;
  dashboard: StudentDashboardResponse;
}>) {
  const animatedGpa = useCountUp(dashboard.gpa ?? 0, { duration: 900, decimals: 2 });
  const animatedCredits = useCountUp(dashboard.creditsEarned, { duration: 900, decimals: 0 });
  const animatedProgress = useCountUp(dashboard.curriculumProgressPercent, {
    duration: 900,
    decimals: 0,
  });

  return (
    <>
      <Reveal index={0}>
        <PageHeader
          title={`สวัสดี, ${fullName}`}
          description="แผนการเรียนวิชาการและตัวชี้วัดความพร้อมของคุณ"
        />
      </Reveal>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Reveal index={1}>
          <StatCard
            icon={Star}
            label="เกรดเฉลี่ยสะสม"
            value={dashboard.gpa !== null ? animatedGpa.toFixed(2) : '—'}
            suffix="/ 4.0"
          />
        </Reveal>
        <Reveal index={2}>
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
        </Reveal>
        <Reveal index={3}>
          <StatCard
            icon={Award}
            label="ความพร้อมสำหรับการสำเร็จการศึกษา"
            value={`${Math.round(animatedProgress)}%`}
            footer={
              <Progress value={animatedProgress} label="ความพร้อมสำหรับการสำเร็จการศึกษา" />
            }
          />
        </Reveal>
      </div>

      <Reveal index={4}>
        <PageSection title="สิ่งที่ต้องทำต่อ">
          <CreditCheckerPanel courses={dashboard.missingRequiredCourses} />
        </PageSection>
      </Reveal>

      <Reveal index={5}>
        <PageSection
          title="ผลลัพธ์การเรียนรู้ (PLO)"
          description="ความสำเร็จตามผลลัพธ์การเรียนรู้ระดับหลักสูตร จากผลการเรียนของคุณ"
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/aptitude-analysis">ดูการวิเคราะห์ฉบับเต็ม</Link>
            </Button>
          }
        >
          <PloRadarCard radar={dashboard.radar} />
        </PageSection>
      </Reveal>
    </>
  );
}
