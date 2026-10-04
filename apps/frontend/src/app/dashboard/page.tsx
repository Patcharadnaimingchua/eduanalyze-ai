'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Award, FileCheck2, Star } from 'lucide-react';
import type { StudentDashboardResponse } from '@eduanalyze-ai/shared-types';
import { fetchOwnStudentProfile, fetchStudentDashboard } from '@/lib/api/dashboard';
import { useAuth } from '@/lib/auth-context';
import { computeGpaChange } from '@/lib/gpa-change';
import { useCountUp } from '@/lib/use-count-up';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { PageSection } from '@/components/layout/page-section';
import { Reveal } from '@/components/layout/reveal';
import { RevealOnScroll } from '@/components/layout/reveal-on-scroll';
import { PageLoadError, StudentOnlyPage } from '@/components/layout/page-states';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { StatCard } from '@/components/dashboard/stat-card';
import { TiltCard } from '@/components/ui/tilt-card';
import { GraduationCelebration } from '@/components/dashboard/graduation-celebration';
import { GpaSparkline } from '@/components/dashboard/gpa-sparkline';
import { GpaChangeBadge } from '@/components/dashboard/gpa-change-badge';
import { CreditCheckerPanel } from '@/components/dashboard/credit-checker-panel';
import { PendingAssessmentPanel } from '@/components/dashboard/pending-assessment-panel';
import { ElectiveProgressPanel } from '@/components/dashboard/elective-progress-panel';
import { PloRadarCard } from '@/components/dashboard/plo-radar-card';
import { Button } from '@/components/ui/button';
import { ProgressRing } from '@/components/ui/progress-ring';
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

  const isLoading = profileQuery.isLoading || dashboardQuery.isLoading;

  if (!isLoading && (profileQuery.isError || dashboardQuery.isError || !dashboardQuery.data)) {
    return (
      <DashboardShell studentCode={profileQuery.data?.studentCode ?? ''} fullName={user.fullName}>
        <PageLoadError
          message="ไม่สามารถโหลดข้อมูลแดชบอร์ดได้ กรุณาลองใหม่อีกครั้ง"
          onRetry={() => {
            profileQuery.refetch();
            dashboardQuery.refetch();
          }}
        />
      </DashboardShell>
    );
  }

  const dashboard = dashboardQuery.data;

  return (
    <DashboardShell
      studentCode={profileQuery.data?.studentCode ?? ''}
      fullName={user.fullName}
      skeleton={<DashboardSkeleton />}
      ready={!isLoading}
    >
      {dashboard && <DashboardCards fullName={user.fullName} dashboard={dashboard} />}
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
  const animatedGpa = useCountUp(dashboard.gpa ?? 0, {
    duration: 1200,
    decimals: 2,
    easing: 'elastic',
    clampMin: 0,
    clampMax: 4,
  });
  const animatedCredits = useCountUp(dashboard.creditsEarned, {
    duration: 1200,
    decimals: 0,
    easing: 'elastic',
    clampMin: 0,
    clampMax: Math.max(dashboard.totalCreditsRequired, dashboard.creditsEarned),
  });
  const animatedProgress = useCountUp(dashboard.curriculumProgressPercent, {
    duration: 900,
    decimals: 0,
  });
  const gpaChange = computeGpaChange(dashboard.gpaTrend);

  return (
    <>
      <GraduationCelebration
        studentProfileId={dashboard.studentProfileId}
        isReady={dashboard.graduationReadiness.isReady}
      />
      <Reveal index={0}>
        <PageHeader
          title={`สวัสดี, ${fullName}`}
          description="แผนการเรียนวิชาการและตัวชี้วัดความพร้อมของคุณ"
        />
      </Reveal>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Reveal index={1}>
          <TiltCard>
            <StatCard
              icon={Star}
              label="เกรดเฉลี่ยสะสม"
              value={dashboard.gpa !== null ? animatedGpa.toFixed(2) : '—'}
              suffix="/ 4.0"
              href="/academic-record"
              footer={
                dashboard.gpaTrend.length >= 2 && (
                  <div className="space-y-2">
                    {gpaChange && <GpaChangeBadge change={gpaChange} />}
                    <GpaSparkline points={dashboard.gpaTrend} />
                  </div>
                )
              }
            />
          </TiltCard>
        </Reveal>
        <Reveal index={2}>
          <StatCard
            icon={FileCheck2}
            label="หน่วยกิตสะสม"
            value={Math.round(animatedCredits)}
            suffix={`/ ${dashboard.totalCreditsRequired}`}
            href="/credit-checker"
            badge={
              dashboard.graduationReadiness.creditsMet
                ? { text: 'ครบตามเกณฑ์', tone: 'positive' }
                : { text: `เหลืออีก ${dashboard.creditsRemaining} หน่วยกิต`, tone: 'neutral' }
            }
            footer={
              dashboard.onTrackStatus && (
                <p
                  className={
                    dashboard.onTrackStatus === 'behind'
                      ? 'text-xs font-medium text-amber-600'
                      : 'text-xs font-medium text-emerald-600'
                  }
                >
                  {dashboard.onTrackStatus === 'behind'
                    ? `ตามหลังแผน — ปีการศึกษานี้ควรมีอย่างน้อย ${dashboard.expectedCredits} หน่วยกิต`
                    : 'ตามแผน'}
                </p>
              )
            }
          />
        </Reveal>
        <Reveal index={3}>
          <TiltCard>
            <StatCard
              icon={Award}
              label="ความพร้อมสำหรับการสำเร็จการศึกษา"
              href="/learning-path"
              visual={
                <ProgressRing
                  value={animatedProgress}
                  label="ความพร้อมสำหรับการสำเร็จการศึกษา"
                />
              }
            />
          </TiltCard>
        </Reveal>
      </div>

      <Reveal index={4}>
        <PageSection title="สิ่งที่ต้องทำต่อ">
          <div className="space-y-4">
            <PendingAssessmentPanel count={dashboard.pendingAssessmentCount} />
            <CreditCheckerPanel courses={dashboard.missingRequiredCourses} />
            <ElectiveProgressPanel categories={dashboard.incompleteElectiveCategories} />
          </div>
        </PageSection>
      </Reveal>

      <RevealOnScroll>
        <PageSection
          title="ผลลัพธ์การเรียนรู้ (PLO)"
          description="ความสำเร็จตามผลลัพธ์การเรียนรู้ระดับหลักสูตร จากผลการเรียนของคุณ"
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/aptitude-analysis">ดูสรุปความถนัด</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/clo-plo-analysis">ดูรายละเอียดราย PLO/CLO</Link>
              </Button>
            </div>
          }
        >
          <PloRadarCard radar={dashboard.radar} />
        </PageSection>
      </RevealOnScroll>
    </>
  );
}
