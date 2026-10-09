'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Building2, GraduationCap, Landmark, ShieldCheck, UserCog, Users } from 'lucide-react';
import { fetchSystemCurriculumOverview } from '@/lib/api/admin';
import { fetchDepartments, fetchFaculties, fetchPrograms } from '@/lib/api/organization';
import { fetchUsers } from '@/lib/api/user-management';
import { countByTab, directoryFromSystemOverview, filterCurricula } from '@/lib/admin-curricula';
import type { CurriculumTab } from '@/lib/admin-curricula';
import { systemUserCounts, tierShares } from '@/lib/system-overview';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { AdminCurriculumCards, CurriculumTabs } from '@/components/admin/admin-curriculum-cards';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { PageHeader } from '@/components/layout/page-header';
import { PageLoadError } from '@/components/layout/page-states';
import { PageSection } from '@/components/layout/page-section';
import { Reveal } from '@/components/layout/reveal';
import { RevealOnScroll } from '@/components/layout/reveal-on-scroll';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton, StatCardsSkeleton } from '@/components/ui/skeleton';
import type { CurriculumDataState } from '@eduanalyze-ai/shared-types';
import type { SemanticTone } from '@/lib/tone';

// The overview shows the first few curricula; the full list is /admin/curriculum.
const PREVIEW_LIMIT = 6;

const TIER_COPY: Record<
  CurriculumDataState,
  { label: string; description: string; tone: SemanticTone }
> = {
  HAS_STUDENTS: {
    label: 'มีนักศึกษา',
    description: 'มีโครงสร้างรายวิชาและมีนักศึกษาในหลักสูตรแล้ว',
    tone: 'success',
  },
  STRUCTURE_ONLY: {
    label: 'มีแต่โครงสร้าง',
    description: 'จัดโครงสร้างรายวิชาแล้ว แต่ยังไม่มีนักศึกษา',
    tone: 'warning',
  },
  EMPTY: {
    label: 'ว่าง',
    description: 'ยังไม่มีรายวิชาและนักศึกษา',
    tone: 'neutral',
  },
};

const linkClass =
  'inline-flex min-h-11 items-center text-sm font-medium text-brand hover:underline';

export default function SystemOverviewPage() {
  return (
    <ProtectedRoute>
      <RequireRole role="SUPER_ADMIN">
        <SystemOverviewContent />
      </RequireRole>
    </ProtectedRoute>
  );
}

function SystemOverviewContent() {
  const { user } = useAuth();
  const [tab, setTab] = useState<CurriculumTab>('ALL');
  const curriculaQuery = useQuery({
    queryKey: ['system-curriculum-overview'],
    queryFn: fetchSystemCurriculumOverview,
  });
  const facultiesQuery = useQuery({ queryKey: ['org-faculties'], queryFn: fetchFaculties });
  const departmentsQuery = useQuery({ queryKey: ['org-departments'], queryFn: fetchDepartments });
  const programsQuery = useQuery({ queryKey: ['org-programs'], queryFn: fetchPrograms });
  const usersQuery = useQuery({ queryKey: ['admin-users'], queryFn: fetchUsers });

  const report = curriculaQuery.data;
  const directory = useMemo(() => (report ? directoryFromSystemOverview(report) : null), [report]);
  const entries = directory?.entries;
  const tabCounts = useMemo(() => countByTab(entries ?? []), [entries]);
  const shares = useMemo(() => tierShares(entries ?? []), [entries]);
  const visible = useMemo(() => filterCurricula(entries ?? [], tab, ''), [entries, tab]);
  const userCounts = useMemo(
    () =>
      usersQuery.data && report
        ? systemUserCounts(usersQuery.data, report.totals.studentCount)
        : null,
    [usersQuery.data, report],
  );

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

  const orgReady = facultiesQuery.data && departmentsQuery.data && programsQuery.data;
  const orgFailed = facultiesQuery.isError || departmentsQuery.isError || programsQuery.isError;

  return (
    <DashboardShell role="SUPER_ADMIN" identityLabel={user.email} fullName={user.fullName}>
      <Reveal index={0}>
        <PageHeader
          title="ภาพรวมระบบ"
          description="โครงสร้างหน่วยงาน ผู้ใช้งานแยกตามบทบาท และสถานะข้อมูลของหลักสูตรทั้งหมดในสถาบัน"
        />
      </Reveal>

      <Reveal index={1}>
        <PageSection
          title="โครงสร้างหน่วยงาน"
          description="นับเฉพาะหน่วยงานที่เปิดใช้งานอยู่"
          actions={
            <Link href="/admin/organization" className={linkClass}>
              ไปที่โครงสร้างองค์กร
            </Link>
          }
        >
          {orgFailed && (
            <PageLoadError
              onRetry={() => {
                void facultiesQuery.refetch();
                void departmentsQuery.refetch();
                void programsQuery.refetch();
              }}
            />
          )}
          {!orgFailed && !orgReady && <StatCardsSkeleton count={3} />}
          {orgReady && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatCard
                icon={Landmark}
                label="คณะ"
                value={<AnimatedNumber value={facultiesQuery.data.length} />}
                suffix="คณะ"
              />
              <StatCard
                icon={Building2}
                label="ภาควิชา"
                value={<AnimatedNumber value={departmentsQuery.data.length} />}
                suffix="ภาควิชา"
              />
              <StatCard
                icon={GraduationCap}
                label="สาขา"
                value={<AnimatedNumber value={programsQuery.data.length} />}
                suffix="สาขา"
              />
            </div>
          )}
        </PageSection>
      </Reveal>

      <Reveal index={2}>
        <PageSection
          title="ผู้ใช้งานแยกตามบทบาท"
          description={
            userCounts
              ? `นับเฉพาะบัญชีที่ยังใช้งานได้ รวมทั้งสิ้น ${userCounts.total.toLocaleString('th-TH')} คน`
              : 'นับเฉพาะบัญชีที่ยังใช้งานได้'
          }
          actions={
            <Link href="/admin/users" className={linkClass}>
              จัดการผู้ใช้งาน
            </Link>
          }
        >
          {(usersQuery.isError || curriculaQuery.isError) && (
            <PageLoadError
              onRetry={() => {
                void usersQuery.refetch();
                void curriculaQuery.refetch();
              }}
            />
          )}
          {!usersQuery.isError && !curriculaQuery.isError && !userCounts && (
            <StatCardsSkeleton count={5} />
          )}
          {userCounts && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard
                icon={ShieldCheck}
                label="ผู้ดูแลระบบสูงสุด"
                value={<AnimatedNumber value={userCounts.superAdmin} />}
                suffix="คน"
              />
              <StatCard
                icon={ShieldCheck}
                label="ผู้ดูแลระบบ"
                value={<AnimatedNumber value={userCounts.admin} />}
                suffix="คน"
              />
              <StatCard
                icon={UserCog}
                label="เจ้าหน้าที่"
                value={<AnimatedNumber value={userCounts.staff} />}
                suffix="คน"
              />
              <StatCard
                icon={Users}
                label="อาจารย์"
                value={<AnimatedNumber value={userCounts.instructor} />}
                suffix="คน"
              />
              <StatCard
                icon={GraduationCap}
                label="นักศึกษา"
                value={<AnimatedNumber value={userCounts.student} />}
                suffix="คน"
              />
            </div>
          )}
        </PageSection>
      </Reveal>

      <RevealOnScroll>
        <PageSection
          title={`สถานะข้อมูลของหลักสูตรทั้งหมด${report ? ` (${report.curricula.length} หลักสูตร)` : ''}`}
          description="แบ่งตามว่าหลักสูตรมีโครงสร้างรายวิชาและนักศึกษาแล้วหรือยัง เลือกดูคุณภาพรายหลักสูตรได้จากการ์ด"
          actions={
            <div className="flex flex-wrap gap-x-4">
              <Link href="/admin/curriculum-dashboard" className={linkClass}>
                เปรียบเทียบผลลัพธ์ PLO
              </Link>
              <Link href="/admin/curriculum" className={linkClass}>
                ดูหลักสูตรทั้งหมด
              </Link>
            </div>
          }
        >
          {curriculaQuery.isLoading && <StatCardsSkeleton count={3} />}
          {directory && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {shares.map((share) => {
                  const copy = TIER_COPY[share.state];
                  return (
                    <Card key={share.state}>
                      <CardContent className="space-y-2 p-5">
                        <div className="flex items-start justify-between gap-2">
                          <Badge tone={copy.tone}>{copy.label}</Badge>
                          <span className="text-2xl font-bold tabular-nums text-primary">
                            {share.count}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{copy.description}</p>
                        <p className="text-sm tabular-nums text-muted-foreground">
                          {share.percent === null
                            ? 'ยังไม่มีหลักสูตรในระบบ'
                            : `คิดเป็น ${share.percent.toFixed(1)}% ของทั้งหมด`}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <CurriculumTabs value={tab} counts={tabCounts} onChange={setTab} />
              <AdminCurriculumCards
                entries={visible.slice(0, PREVIEW_LIMIT)}
                programs={directory.programs}
                filtered={tab !== 'ALL'}
              />
              {visible.length > PREVIEW_LIMIT && (
                <p className="text-sm text-muted-foreground">
                  แสดง {PREVIEW_LIMIT} จาก {visible.length} หลักสูตร —{' '}
                  <Link href="/admin/curriculum" className={cn(linkClass, 'underline')}>
                    ดูทั้งหมด
                  </Link>
                </p>
              )}
            </>
          )}
        </PageSection>
      </RevealOnScroll>
    </DashboardShell>
  );
}
