'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, GraduationCap, Landmark, ShieldCheck, UserCog, Users } from 'lucide-react';
import { fetchAdminScopeOverview } from '@/lib/api/admin';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { PageHeader } from '@/components/layout/page-header';
import { PageLoadError } from '@/components/layout/page-states';
import { PageSection } from '@/components/layout/page-section';
import { Reveal } from '@/components/layout/reveal';
import { AdminScopeCurriculumList } from '@/components/admin/admin-scope-curriculum-list';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton, StatCardsSkeleton } from '@/components/ui/skeleton';

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
  const overviewQuery = useQuery({
    queryKey: ['admin-scope-overview'],
    queryFn: fetchAdminScopeOverview,
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

  const data = overviewQuery.data;
  const isEmptyScope = data && data.scope.programCount === 0;

  return (
    <DashboardShell role="ADMIN" identityLabel={user.email} fullName={user.fullName}>
      <Reveal index={0}>
        <PageHeader
          title="ภาพรวมขอบเขตที่ดูแล"
          description="คณะ/ภาควิชา/สาขาที่คุณดูแล จำนวนผู้ใช้งานแยกตาม role และหลักสูตรในความดูแลที่ยังไม่มีข้อมูล"
        />
      </Reveal>

      {overviewQuery.isLoading && <StatCardsSkeleton count={3} />}
      {overviewQuery.isError && <PageLoadError />}

      {isEmptyScope && (
        <Reveal index={1}>
          <EmptyState
            icon={ShieldCheck}
            description="บัญชีนี้ยังไม่ได้รับมอบขอบเขต (Faculty/Department/Program) ใดๆ — ติดต่อ SUPER_ADMIN เพื่อขอมอบขอบเขต"
          />
        </Reveal>
      )}

      {data && !isEmptyScope && (
        <>
          <Reveal index={1}>
            <PageSection title="ขอบเขตที่ดูแล">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard icon={Landmark} label="คณะ" value={data.scope.facultyCount} suffix="คณะ" />
                <StatCard
                  icon={Building2}
                  label="ภาควิชา"
                  value={data.scope.departmentCount}
                  suffix="ภาควิชา"
                />
                <StatCard
                  icon={GraduationCap}
                  label="สาขา"
                  value={data.scope.programCount}
                  suffix="สาขา"
                />
              </div>
            </PageSection>
          </Reveal>

          <Reveal index={2}>
            <PageSection title="ผู้ใช้งานในขอบเขต">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                <StatCard icon={UserCog} label="เจ้าหน้าที่ (STAFF)" value={data.userCounts.staff} suffix="คน" />
                <StatCard
                  icon={Users}
                  label="อาจารย์ (INSTRUCTOR)"
                  value={data.userCounts.instructor}
                  suffix="คน"
                />
                <StatCard icon={ShieldCheck} label="ผู้ดูแล (ADMIN)" value={data.userCounts.admin} suffix="คน" />
                <StatCard
                  icon={GraduationCap}
                  label="นักศึกษา (STUDENT)"
                  value={data.userCounts.student}
                  suffix="คน"
                />
              </div>
            </PageSection>
          </Reveal>

          <Reveal index={3}>
            <PageSection
              title="หลักสูตรในความดูแล"
              description={`มีนักศึกษาแล้ว ${data.curricula.hasStudentsCount} · จัดโครงสร้างแล้วแต่ยังไม่มีนักศึกษา ${data.curricula.structureOnlyCount} · ยังไม่ได้จัดทำ ${data.curricula.emptyCount} จากทั้งหมด ${data.curricula.totalCount} หลักสูตร`}
            >
              <AdminScopeCurriculumList curricula={data.curricula.entries} />
            </PageSection>
          </Reveal>
        </>
      )}
    </DashboardShell>
  );
}
