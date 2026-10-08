'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Building2, GraduationCap, Landmark, ShieldCheck, UserCog, Users } from 'lucide-react';
import { fetchAdminScopeOverview } from '@/lib/api/admin';
import {
  countByTab,
  filterCurricula,
  shareOfPeople,
  type CurriculumTab,
} from '@/lib/admin-curricula';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { AdminCurriculumCards, CurriculumTabs } from '@/components/admin/admin-curriculum-cards';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { PageHeader } from '@/components/layout/page-header';
import { PageLoadError } from '@/components/layout/page-states';
import { PageSection } from '@/components/layout/page-section';
import { Reveal } from '@/components/layout/reveal';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton, StatCardsSkeleton } from '@/components/ui/skeleton';

// The overview shows the first few curricula; the full list is /admin/curriculum.
const PREVIEW_LIMIT = 6;

export default function AdminOverviewPage() {
  return (
    <ProtectedRoute>
      <RequireRole role="ADMIN">
        <AdminOverviewContent />
      </RequireRole>
    </ProtectedRoute>
  );
}

function AdminOverviewContent() {
  const { user } = useAuth();
  const [tab, setTab] = useState<CurriculumTab>('ALL');
  const overviewQuery = useQuery({
    queryKey: ['admin-scope-overview'],
    queryFn: fetchAdminScopeOverview,
  });
  const data = overviewQuery.data;
  const entries = data?.curricula.entries;
  const tabCounts = useMemo(() => countByTab(entries ?? []), [entries]);
  const visible = useMemo(() => filterCurricula(entries ?? [], tab, ''), [entries, tab]);

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

  const isEmptyScope = data && data.scope.programCount === 0;
  const facultyNames = [...new Set((data?.scope.programs ?? []).map((p) => p.facultyName))];
  const peopleTotal = data
    ? data.userCounts.staff +
      data.userCounts.instructor +
      data.userCounts.admin +
      data.userCounts.student
    : 0;
  const shareFooter = (count: number) => {
    const share = shareOfPeople(count, peopleTotal);
    return share === null ? null : (
      <p className="text-xs text-muted-foreground">คิดเป็น {share}% ของผู้ใช้งานทั้งหมดในขอบเขต</p>
    );
  };

  return (
    <DashboardShell role="ADMIN" identityLabel={user.email} fullName={user.fullName}>
      <Reveal index={0}>
        <PageHeader
          title="ภาพรวมขอบเขต"
          description="คณะ ภาควิชา และสาขาที่คุณดูแล จำนวนผู้ใช้งานแยกตามบทบาท และหลักสูตรในความดูแล"
          actions={
            facultyNames.length > 0 && (
              <p className="rounded-lg border bg-card px-4 py-2 text-sm">
                <span className="block text-xs text-muted-foreground">ขอบเขตที่รับผิดชอบ</span>
                <span className="font-semibold text-primary">{facultyNames.join(' · ')}</span>
              </p>
            )
          }
        />
      </Reveal>

      {overviewQuery.isLoading && <StatCardsSkeleton count={3} />}
      {overviewQuery.isError && <PageLoadError onRetry={() => overviewQuery.refetch()} />}

      {isEmptyScope && (
        <Reveal index={1}>
          <EmptyState
            icon={ShieldCheck}
            description="บัญชีนี้ยังไม่ได้รับมอบขอบเขต (คณะ/ภาควิชา/สาขา) ใดๆ — ติดต่อ SUPER_ADMIN เพื่อขอมอบขอบเขต"
          />
        </Reveal>
      )}

      {data && !isEmptyScope && (
        <>
          <Reveal index={1}>
            <PageSection title="ขอบเขตที่ดูแล">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard
                  icon={Landmark}
                  label="คณะในขอบเขต"
                  value={<AnimatedNumber value={data.scope.facultyCount} />}
                  suffix="คณะ"
                />
                <StatCard
                  icon={Building2}
                  label="ภาควิชาในขอบเขต"
                  value={<AnimatedNumber value={data.scope.departmentCount} />}
                  suffix="ภาควิชา"
                />
                <StatCard
                  icon={GraduationCap}
                  label="สาขาวิชาในขอบเขต"
                  value={<AnimatedNumber value={data.scope.programCount} />}
                  suffix="สาขาวิชา"
                />
              </div>
            </PageSection>
          </Reveal>

          <Reveal index={2}>
            <PageSection
              title="สรุปจำนวนผู้ใช้งานแยกตามบทบาท"
              description="นับเฉพาะบัญชีที่ใช้งานอยู่ภายในขอบเขตของคุณ"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  icon={Users}
                  label="อาจารย์ผู้สอน"
                  value={<AnimatedNumber value={data.userCounts.instructor} />}
                  suffix="คน"
                  footer={shareFooter(data.userCounts.instructor)}
                />
                <StatCard
                  icon={UserCog}
                  label="เจ้าหน้าที่ทะเบียน"
                  value={<AnimatedNumber value={data.userCounts.staff} />}
                  suffix="คน"
                  footer={shareFooter(data.userCounts.staff)}
                />
                <StatCard
                  icon={ShieldCheck}
                  label="ผู้ดูแลระบบ"
                  value={<AnimatedNumber value={data.userCounts.admin} />}
                  suffix="คน"
                  footer={shareFooter(data.userCounts.admin)}
                />
                <StatCard
                  icon={GraduationCap}
                  label="นักศึกษา"
                  value={<AnimatedNumber value={data.userCounts.student} />}
                  suffix="คน"
                  footer={shareFooter(data.userCounts.student)}
                />
              </div>
            </PageSection>
          </Reveal>

          <Reveal index={3}>
            <PageSection
              title="หลักสูตรในความดูแล"
              description={`ทั้งหมด ${data.curricula.totalCount} หลักสูตร — เลือกดูคุณภาพรายหลักสูตรได้จากการ์ด`}
              actions={
                <Link
                  href="/admin/curriculum"
                  className="inline-flex min-h-11 items-center text-sm font-medium text-brand hover:underline"
                >
                  ดูหลักสูตรทั้งหมด
                </Link>
              }
            >
              <CurriculumTabs value={tab} counts={tabCounts} onChange={setTab} />
              <AdminCurriculumCards
                entries={visible.slice(0, PREVIEW_LIMIT)}
                programs={data.scope.programs}
                filtered={tab !== 'ALL'}
              />
              {visible.length > PREVIEW_LIMIT && (
                <p className="text-sm text-muted-foreground">
                  แสดง {PREVIEW_LIMIT} จาก {visible.length} หลักสูตร —{' '}
                  <Link href="/admin/curriculum" className="font-medium text-brand hover:underline">
                    ดูทั้งหมด
                  </Link>
                </p>
              )}
            </PageSection>
          </Reveal>
        </>
      )}
    </DashboardShell>
  );
}
