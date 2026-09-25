'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { fetchStaffOverview, fetchStudentInvitations } from '@/lib/api/staff';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RequireRole } from '@/components/auth/require-role';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';
import { PageLoadError } from '@/components/layout/page-states';
import { PageSection } from '@/components/layout/page-section';
import { Reveal } from '@/components/layout/reveal';
import { StudentInvitationCsvPanel } from '@/components/staff/student-invitation-csv-panel';
import { StudentInvitationList } from '@/components/staff/student-invitation-list';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function StaffStudentInvitationsPage() {
  return (
    <ProtectedRoute>
      <RequireRole role="STAFF">
        <StaffStudentInvitationsContent />
      </RequireRole>
    </ProtectedRoute>
  );
}

function StaffStudentInvitationsContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCsvPanel, setShowCsvPanel] = useState(false);

  const overviewQuery = useQuery({ queryKey: ['staff-overview'], queryFn: fetchStaffOverview });
  const invitationsQuery = useQuery({
    queryKey: ['student-invitations'],
    queryFn: fetchStudentInvitations,
  });

  function refetchInvitations() {
    queryClient.invalidateQueries({ queryKey: ['student-invitations'] });
  }

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

  return (
    <DashboardShell role="STAFF" identityLabel={user.email} fullName={user.fullName}>
      <Reveal index={0}>
        <PageHeader
          title="เชิญนักศึกษาใหม่"
          description="นำเข้ารายชื่อนักศึกษาที่จะเข้าศึกษาจากไฟล์ CSV — ระบบส่งอีเมลเชิญให้แต่ละคน ผู้ถูกเชิญยังต้องสมัครสมาชิกด้วยตนเอง"
          actions={
            <Button
              type="button"
              variant={showCsvPanel ? 'outline' : 'default'}
              className="gap-1.5"
              onClick={() => setShowCsvPanel((open) => !open)}
            >
              {showCsvPanel ? (
                'ยกเลิก'
              ) : (
                <>
                  <Plus size={16} />
                  นำเข้าจาก CSV
                </>
              )}
            </Button>
          }
        />
      </Reveal>

      {overviewQuery.isLoading && <Skeleton className="h-32 w-full" />}
      {overviewQuery.isError && <PageLoadError message="ไม่สามารถโหลดข้อมูลสาขาที่คุณดูแลได้" />}

      {showCsvPanel && overviewQuery.data && (
        <Reveal>
          <StudentInvitationCsvPanel
            overview={overviewQuery.data}
            onInvited={refetchInvitations}
            onClose={() => setShowCsvPanel(false)}
          />
        </Reveal>
      )}

      <Reveal index={1}>
        <PageSection title="คำเชิญที่ค้างอยู่">
          {invitationsQuery.isLoading && <Skeleton className="h-40 w-full" />}
          {invitationsQuery.isError && <PageLoadError />}
          {invitationsQuery.data && (
            <StudentInvitationList
              invitations={invitationsQuery.data}
              onChanged={refetchInvitations}
            />
          )}
        </PageSection>
      </Reveal>
    </DashboardShell>
  );
}
