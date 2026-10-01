'use client';

import { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Award, ChevronDown, FileCheck2, GraduationCap, Map as MapIcon } from 'lucide-react';
import type { CourseSummary, CreditCheckReport } from '@eduanalyze-ai/shared-types';
import { fetchOwnStudentProfile } from '@/lib/api/dashboard';
import { fetchCreditCheck } from '@/lib/api/credit-checker';
import { useAuth } from '@/lib/auth-context';
import { useCelebrateOnce } from '@/lib/use-celebrate-once';
import { useCountUp } from '@/lib/use-count-up';
import { cn } from '@/lib/utils';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { PageSection } from '@/components/layout/page-section';
import { Reveal } from '@/components/layout/reveal';
import { PageLoadError, StudentOnlyPage } from '@/components/layout/page-states';
import { StatCard } from '@/components/dashboard/stat-card';
import { CategoryProgressList } from '@/components/credit-checker/category-progress-list';
import { MissingCoursesList } from '@/components/credit-checker/missing-courses-list';
import { FailedCoursesList } from '@/components/credit-checker/failed-courses-list';
import { Button } from '@/components/ui/button';
import { ConfettiBurst } from '@/components/ui/confetti-burst';
import { ProgressRing } from '@/components/ui/progress-ring';
import { ListSkeleton, Skeleton, StatCardsSkeleton } from '@/components/ui/skeleton';

// React Flow is the heaviest dependency on this page and the chart starts
// collapsed, so it is only fetched once the student opens it.
const PrerequisiteFlowChart = dynamic(
  () => import('@/components/credit-checker/prerequisite-flow-chart').then((m) => m.PrerequisiteFlowChart),
  { ssr: false, loading: () => <Skeleton className="h-[600px] w-full" /> },
);

export default function CreditCheckerPage() {
  return (
    <ProtectedRoute>
      <CreditCheckerContent />
    </ProtectedRoute>
  );
}

function CreditCheckerContent() {
  const { user } = useAuth();
  const isStudent = !!user?.roles.includes('STUDENT');

  const profileQuery = useQuery({
    queryKey: ['student-profile-me'],
    queryFn: fetchOwnStudentProfile,
    enabled: isStudent,
  });
  const studentProfileId = profileQuery.data?.id;

  const reportQuery = useQuery({
    queryKey: ['credit-check', studentProfileId],
    queryFn: () => fetchCreditCheck(studentProfileId!),
    enabled: !!studentProfileId,
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

  if (profileQuery.isLoading || reportQuery.isLoading) {
    return (
      <DashboardShell studentCode={profileQuery.data?.studentCode ?? ''} fullName={user.fullName}>
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <StatCardsSkeleton count={4} className="md:grid-cols-2 lg:grid-cols-4" />
        <ListSkeleton items={4} />
      </DashboardShell>
    );
  }

  if (profileQuery.isError || reportQuery.isError || !profileQuery.data || !reportQuery.data) {
    return (
      <DashboardShell studentCode={profileQuery.data?.studentCode ?? ''} fullName={user.fullName}>
        <PageLoadError
          onRetry={() => {
            profileQuery.refetch();
            reportQuery.refetch();
          }}
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell studentCode={profileQuery.data.studentCode} fullName={user.fullName}>
      <CreditCheckReportView report={reportQuery.data} />
    </DashboardShell>
  );
}

function CreditCheckReportView({ report }: Readonly<{ report: CreditCheckReport }>) {
  const [showFlowChart, setShowFlowChart] = useState(false);
  const flowChartId = useId();

  const failedCourseIds = useMemo(
    () => new Set(report.failedCourses.map((c) => c.courseId)),
    [report.failedCourses],
  );
  const passedCourseIds = useMemo(
    () => new Set(report.passedCourses.map((c) => c.courseId)),
    [report.passedCourses],
  );
  // Prerequisite ids can point at any course in the curriculum, not just
  // the ones already surfaced as missing — union every bucket the report
  // gives us so a lookup never comes back empty.
  const courseById = useMemo(() => {
    const all: CourseSummary[] = [
      ...report.passedCourses,
      ...report.failedCourses,
      ...report.notYetStudiedCourses,
      ...report.missingRequiredCourses,
    ];
    return new Map(all.map((c) => [c.courseId, c]));
  }, [report.passedCourses, report.failedCourses, report.notYetStudiedCourses, report.missingRequiredCourses]);
  const hasFailed = report.failedCourses.length > 0;
  const completeCategories = report.categoryProgress.filter((c) => c.isComplete).length;
  const curriculumCourseCount =
    report.passedCourses.length + report.failedCourses.length + report.notYetStudiedCourses.length;
  const celebrateReady = useCelebrateOnce(
    `celebrate:credit-ready:${report.studentProfileId}`,
    report.graduationReadiness.isReady,
  );
  const readinessPercent =
    report.totalCreditsRequired > 0 ? (report.creditsPassed / report.totalCreditsRequired) * 100 : 0;
  const animatedReadiness = useCountUp(readinessPercent, { duration: 900, decimals: 0 });

  return (
    <>
      <PageHeader
        title="ตรวจสอบหน่วยกิต"
        description="ตรวจสอบความคืบหน้าการเรียนเทียบกับโครงสร้างหลักสูตรของคุณแบบละเอียด"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Reveal index={1}>
          <StatCard
            icon={GraduationCap}
            label="ความพร้อมสำเร็จการศึกษา"
            visual={
              <ProgressRing value={animatedReadiness} label="ความพร้อมสำเร็จการศึกษา (ตามหน่วยกิต)" />
            }
          />
        </Reveal>
        <Reveal index={2}>
          <StatCard
            icon={FileCheck2}
            label="หน่วยกิตสะสม"
            value={report.creditsPassed}
            suffix={`/ ${report.totalCreditsRequired}`}
          />
        </Reveal>
        <Reveal index={3}>
          <StatCard icon={Award} label="หน่วยกิตที่เหลือ" value={report.creditsRemaining} />
        </Reveal>
        <Reveal index={4} className="relative">
          <StatCard
            icon={GraduationCap}
            label="วิชาบังคับที่ยังขาด"
            value={report.graduationReadiness.missingRequiredCount}
            suffix="วิชา"
            badge={
              report.graduationReadiness.isReady
                ? { text: 'พร้อมสำเร็จการศึกษา', tone: 'positive' }
                : { text: 'ยังไม่พร้อม', tone: 'neutral' }
            }
          />
          {celebrateReady && <ConfettiBurst delayMs={500} />}
        </Reveal>
      </div>

      <Reveal index={5}>
        <PageSection
          title="ต้องจัดการ"
          actions={
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/learning-path">
                <MapIcon size={14} aria-hidden="true" />
                ไปที่แผนการเรียน
              </Link>
            </Button>
          }
        >
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
            <div className={hasFailed ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <MissingCoursesList
                courses={report.missingRequiredCourses}
                failedCourseIds={failedCourseIds}
                courseById={courseById}
                passedCourseIds={passedCourseIds}
              />
            </div>
            {hasFailed && <FailedCoursesList courses={report.failedCourses} />}
          </div>
        </PageSection>
      </Reveal>

      <Reveal index={6}>
        <PageSection
          title="ความคืบหน้าตามหมวด"
          description={`ครบแล้ว ${completeCategories} จาก ${report.categoryProgress.length} หมวด`}
        >
          <CategoryProgressList categories={report.categoryProgress} />
        </PageSection>
      </Reveal>

      <Reveal index={7}>
        <PageSection
          title="แผนผังวิชาต่อเนื่อง"
          description={`ลำดับวิชาก่อน-หลังของทุกวิชาในหลักสูตร (${curriculumCourseCount} วิชา)`}
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowFlowChart((v) => !v)}
              aria-expanded={showFlowChart}
              aria-controls={flowChartId}
              className="gap-1.5"
            >
              {showFlowChart ? 'ซ่อนแผนผัง' : 'แสดงแผนผัง'}
              <ChevronDown size={14} className={cn('transition-transform', showFlowChart && 'rotate-180')} />
            </Button>
          }
        >
          {showFlowChart && (
            <div id={flowChartId}>
              <PrerequisiteFlowChart report={report} />
            </div>
          )}
        </PageSection>
      </Reveal>
    </>
  );
}
