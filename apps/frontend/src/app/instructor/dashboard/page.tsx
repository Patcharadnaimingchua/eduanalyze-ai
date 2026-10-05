'use client';

import { AlertTriangle, BookOpen, Target, Users } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchInstructorDashboard } from '@/lib/api/instructor';
import { useAuth } from '@/lib/auth-context';
import { countFollowUps } from '@/lib/follow-ups';
import {
  buildInstructorSummary,
  computeAchievementChange,
  overallAchievementPercent,
  sortCoursesByAttention,
} from '@/lib/instructor-summary';
import { RISK_LEVEL_LABELS, RISK_LEVEL_TONES } from '@/lib/risk-level';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { InstructorDashboardSkeleton } from '@/components/instructor/instructor-dashboard-skeleton';
import { InstructorCourseGrid } from '@/components/instructor/instructor-course-grid';
import { AtRiskStudentsCard } from '@/components/instructor/at-risk-students-card';
import { CloAttentionCard } from '@/components/instructor/clo-attention-card';
import { PloCoverageCard } from '@/components/instructor/plo-coverage-card';
import { CourseComparisonChart } from '@/components/instructor/course-comparison-chart';
import { CourseInsightCard } from '@/components/instructor/course-insight-card';
import { AchievementChangeBadge } from '@/components/instructor/achievement-change-badge';
import { PageHeader } from '@/components/layout/page-header';
import { PageSection } from '@/components/layout/page-section';
import { Reveal } from '@/components/layout/reveal';
import { RevealOnScroll } from '@/components/layout/reveal-on-scroll';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { Skeleton } from '@/components/ui/skeleton';

export default function InstructorDashboardPage() {
  return (
    <ProtectedRoute>
      <InstructorDashboardContent />
    </ProtectedRoute>
  );
}

function InstructorDashboardContent() {
  const { user } = useAuth();
  const isInstructor = !!user?.roles.includes('INSTRUCTOR');

  const dashboardQuery = useQuery({
    queryKey: ['instructor-dashboard'],
    queryFn: fetchInstructorDashboard,
    enabled: isInstructor,
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

  const courses = dashboardQuery.data?.courses ?? [];
  const enrollments = courses.reduce((sum, c) => sum + c.studentCount, 0);
  const achievement = overallAchievementPercent(courses);
  const achievementChange = computeAchievementChange(courses);
  const followUps = countFollowUps(courses);
  const summary = dashboardQuery.data ? buildInstructorSummary(courses) : null;

  return (
    <RequireRole role="INSTRUCTOR">
      <DashboardShell role="INSTRUCTOR" identityLabel={user.email} fullName={user.fullName}>
        <Reveal index={0}>
          <PageHeader
            title="แดชบอร์ดอาจารย์"
            description={summary ?? 'ภาพรวมผลการเรียนและ CLO Achievement ของรายวิชาที่คุณสอน'}
          />
        </Reveal>

        {dashboardQuery.isLoading && <InstructorDashboardSkeleton />}

        {dashboardQuery.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              ไม่สามารถโหลดข้อมูลแดชบอร์ดได้ กรุณาลองใหม่อีกครั้ง
            </AlertDescription>
          </Alert>
        )}

        {dashboardQuery.data && courses.length === 0 && (
          <Alert>
            <AlertDescription>ยังไม่มีวิชาที่ได้รับมอบหมายให้คุณสอน</AlertDescription>
          </Alert>
        )}

        {dashboardQuery.data && courses.length > 0 && (
          <>
            {/* 4 columns only from xl: with the 256px sidebar, lg leaves ~164px per card. */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Reveal index={1}>
                <StatCard icon={BookOpen} label="รายวิชาที่สอน" value={courses.length} suffix="วิชา" />
              </Reveal>
              <Reveal index={2}>
                <StatCard
                  icon={Users}
                  label="นักศึกษา (นับตามรายวิชา)"
                  value={enrollments}
                  suffix="คน"
                />
              </Reveal>
              <Reveal index={3}>
                <StatCard
                  icon={Target}
                  label="ผลสัมฤทธิ์เฉลี่ย (เกรด B ขึ้นไป)"
                  value={achievement === null ? '—' : `${Math.round(achievement)}%`}
                  footer={achievementChange && <AchievementChangeBadge change={achievementChange} />}
                />
              </Reveal>
              <Reveal index={4}>
                <StatCard
                  icon={AlertTriangle}
                  label="นักศึกษาที่ต้องติดตาม (นับรายคน)"
                  value={followUps.total}
                  suffix="คน"
                  href={followUps.total > 0 ? '#follow-up' : undefined}
                  footer={
                    followUps.total > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {followUps.critical > 0 && (
                          <Badge tone={RISK_LEVEL_TONES.CRITICAL}>
                            {RISK_LEVEL_LABELS.CRITICAL} {followUps.critical}
                          </Badge>
                        )}
                        {followUps.watch > 0 && (
                          <Badge tone={RISK_LEVEL_TONES.WATCH}>
                            {RISK_LEVEL_LABELS.WATCH} {followUps.watch}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">ยังไม่มีนักศึกษาที่ต้องติดตาม</p>
                    )
                  }
                />
              </Reveal>
            </div>
            <div id="follow-up" className="scroll-mt-6">
              <Reveal index={5}>
                <AtRiskStudentsCard courses={courses} />
                {/* Outside the card: AtRiskStudentsCard is shared with the staff dashboard. */}
                {followUps.total > 0 && (
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-sm text-muted-foreground">
                    ดูรายชื่อทั้งหมดในหน้านักศึกษา:
                    {followUps.critical > 0 && (
                      <Link
                        href="/instructor/students?risk=CRITICAL"
                        className="font-medium text-brand hover:underline"
                      >
                        ระดับ{RISK_LEVEL_LABELS.CRITICAL} →
                      </Link>
                    )}
                    {followUps.watch > 0 && (
                      <Link
                        href="/instructor/students?risk=WATCH"
                        className="font-medium text-brand hover:underline"
                      >
                        ระดับ{RISK_LEVEL_LABELS.WATCH} →
                      </Link>
                    )}
                  </p>
                )}
              </Reveal>
            </div>
            <RevealOnScroll>
              <PageSection title="รายวิชาที่สอน" description="เรียงจากวิชาที่ผลสัมฤทธิ์ต่ำสุดก่อน">
                <InstructorCourseGrid courses={sortCoursesByAttention(courses)} />
              </PageSection>
            </RevealOnScroll>
            <RevealOnScroll>
              <CloAttentionCard courses={courses} />
            </RevealOnScroll>
            <RevealOnScroll>
              <CollapsibleSection
                framed={false}
                title="ข้อมูลเชิงลึก"
                meta={
                  <span className="text-sm font-normal text-muted-foreground">
                    จุดแข็งและข้อเสนอแนะ · PLO
                    {courses.length >= 2 && ' · เปรียบเทียบรายวิชา'}
                  </span>
                }
              >
                <CourseInsightCard courses={courses} />
                <PloCoverageCard courses={courses} />
                {courses.length >= 2 && <CourseComparisonChart courses={courses} />}
              </CollapsibleSection>
            </RevealOnScroll>
          </>
        )}
      </DashboardShell>
    </RequireRole>
  );
}
