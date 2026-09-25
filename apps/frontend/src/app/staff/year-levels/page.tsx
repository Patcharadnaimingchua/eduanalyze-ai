'use client';

import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { fetchStaffYearLevels } from '@/lib/api/staff';
import { useAuth } from '@/lib/auth-context';
import { RISK_LEVEL_LABELS, RISK_LEVEL_TONES } from '@/lib/risk-level';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { YearLevelOverview } from '@/components/dashboard/year-level-overview';
import { PageHeader } from '@/components/layout/page-header';
import { PageLoadError } from '@/components/layout/page-states';
import { Reveal } from '@/components/layout/reveal';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton, StatCardsSkeleton } from '@/components/ui/skeleton';

export default function StaffYearLevelsPage() {
  return (
    <ProtectedRoute>
      <RequireRole role="STAFF">
        <StaffYearLevelsContent />
      </RequireRole>
    </ProtectedRoute>
  );
}

function StaffYearLevelsContent() {
  const { user } = useAuth();
  const query = useQuery({ queryKey: ['staff-year-levels'], queryFn: fetchStaffYearLevels });

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

  const buckets = query.data?.buckets ?? [];
  const totalStudents = buckets.reduce((sum, b) => sum + b.students.length, 0);

  return (
    <DashboardShell role="STAFF" identityLabel={user.email} fullName={user.fullName}>
      <Reveal index={0}>
        <PageHeader
          title="ภาพรวมชั้นปี"
          description="นักศึกษาในสาขา/หลักสูตรที่คุณดูแล แบ่งตามชั้นปี (เฉพาะนักศึกษาที่ยังไม่ถูกระงับ)"
        />
      </Reveal>

      {query.isLoading && <StatCardsSkeleton count={4} />}

      {query.isError && <PageLoadError />}

      {query.data && totalStudents === 0 && (
        <Reveal index={1}>
          <Card>
            <CardContent className="pt-6">
              <EmptyState icon={Users} description="ยังไม่มีนักศึกษาในขอบเขตที่คุณดูแล" />
            </CardContent>
          </Card>
        </Reveal>
      )}

      {query.data && totalStudents > 0 && (
        <YearLevelOverview
          buckets={buckets}
          studentHref={(s) => `/staff/students/${s.studentProfileId}`}
          renderCardExtra={(bucket) => {
            const critical = bucket.students.filter((s) => s.riskLevel === 'CRITICAL').length;
            const watch = bucket.students.filter((s) => s.riskLevel === 'WATCH').length;
            if (critical === 0 && watch === 0) return null;
            return (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {critical > 0 && (
                  <Badge tone={RISK_LEVEL_TONES.CRITICAL}>
                    {RISK_LEVEL_LABELS.CRITICAL} {critical}
                  </Badge>
                )}
                {watch > 0 && (
                  <Badge tone={RISK_LEVEL_TONES.WATCH}>
                    {RISK_LEVEL_LABELS.WATCH} {watch}
                  </Badge>
                )}
              </div>
            );
          }}
          renderStudentExtra={(s) => (
            <>
              <span className="text-xs text-muted-foreground">
                GPA {s.gpa === null ? '—' : s.gpa.toFixed(2)}
              </span>
              <Badge tone={RISK_LEVEL_TONES[s.riskLevel]}>{RISK_LEVEL_LABELS[s.riskLevel]}</Badge>
            </>
          )}
        />
      )}
    </DashboardShell>
  );
}
