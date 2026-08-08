'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchOwnStudentProfile } from '@/lib/api/dashboard';
import { fetchStudentPloAchievement } from '@/lib/api/plo-achievement';
import { fetchAiSkillAnalysis } from '@/lib/api/ai-analysis';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PloRadarChart } from '@/components/aptitude-analysis/plo-radar-chart';
import { AiInterpretationCard } from '@/components/aptitude-analysis/ai-interpretation-card';

export default function AptitudeAnalysisPage() {
  return (
    <ProtectedRoute>
      <AptitudeAnalysisContent />
    </ProtectedRoute>
  );
}

function AptitudeAnalysisContent() {
  const { user } = useAuth();
  const isStudent = !!user?.roles.includes('STUDENT');

  const profileQuery = useQuery({
    queryKey: ['student-profile-me'],
    queryFn: fetchOwnStudentProfile,
    enabled: isStudent,
  });
  const studentProfileId = profileQuery.data?.id;

  const ploQuery = useQuery({
    queryKey: ['student-plo-achievement', studentProfileId],
    queryFn: () => fetchStudentPloAchievement(studentProfileId!),
    enabled: !!studentProfileId,
  });

  // Independent from ploQuery on purpose — the AI call (ANTHROPIC_API_KEY-
  // dependent, may 503) must never block or blank out the real PLO chart
  // above it. retry: false since a 503 here is a service-unavailable
  // state, not a transient network blip worth retrying automatically.
  const aiQuery = useQuery({
    queryKey: ['ai-skill-analysis', studentProfileId],
    queryFn: () => fetchAiSkillAnalysis(studentProfileId!),
    enabled: !!studentProfileId,
    retry: false,
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

  if (profileQuery.isLoading || ploQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (profileQuery.isError || ploQuery.isError || !profileQuery.data || !ploQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>
      </div>
    );
  }

  return (
    <DashboardShell studentCode={profileQuery.data.studentCode} fullName={user.fullName}>
      <div>
        <h1 className="text-2xl font-semibold text-primary">วัดความถนัด</h1>
        <p className="text-sm text-muted-foreground">
          ภาพรวมผลลัพธ์การเรียนรู้ระดับหลักสูตร (PLO) พร้อมการตีความโดย AI
        </p>
      </div>

      <PloRadarChart radar={ploQuery.data.radar} />

      <AiInterpretationCard
        report={aiQuery.data}
        isLoading={aiQuery.isLoading}
        isError={aiQuery.isError}
      />
    </DashboardShell>
  );
}
