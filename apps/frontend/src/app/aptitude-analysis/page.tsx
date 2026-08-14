'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchOwnStudentProfile } from '@/lib/api/dashboard';
import { fetchStudentPloAchievement, fetchCurriculum } from '@/lib/api/plo-achievement';
import { interpretPloRadar } from '@/lib/interpret-plo-radar';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PloRadarChart } from '@/components/aptitude-analysis/plo-radar-chart';
import { PloInterpretationCard } from '@/components/aptitude-analysis/plo-interpretation-card';
import { AptitudeAnalysisSkeleton } from '@/components/aptitude-analysis/aptitude-analysis-skeleton';

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
  const curriculumId = profileQuery.data?.curriculumId;

  const ploQuery = useQuery({
    queryKey: ['student-plo-achievement', studentProfileId],
    queryFn: () => fetchStudentPloAchievement(studentProfileId!),
    enabled: !!studentProfileId,
  });

  const curriculumQuery = useQuery({
    queryKey: ['curriculum', curriculumId],
    queryFn: () => fetchCurriculum(curriculumId!),
    enabled: !!curriculumId,
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

  if (profileQuery.isLoading || ploQuery.isLoading || curriculumQuery.isLoading) {
    return (
      <DashboardShell studentCode={profileQuery.data?.studentCode ?? ''} fullName={user.fullName}>
        <AptitudeAnalysisSkeleton />
      </DashboardShell>
    );
  }

  if (
    profileQuery.isError ||
    ploQuery.isError ||
    curriculumQuery.isError ||
    !profileQuery.data ||
    !ploQuery.data ||
    !curriculumQuery.data
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>
      </div>
    );
  }

  const interpretation = interpretPloRadar(
    ploQuery.data.radar,
    curriculumQuery.data.defaultAchievementThreshold,
  );

  return (
    <DashboardShell studentCode={profileQuery.data.studentCode} fullName={user.fullName}>
      <div>
        <h1 className="text-2xl font-semibold text-primary">วัดความถนัด</h1>
        <p className="text-sm text-muted-foreground">
          ภาพรวมผลลัพธ์การเรียนรู้ระดับหลักสูตร (PLO) พร้อมสรุปผลตามเกณฑ์ที่กำหนด
        </p>
      </div>

      <div
        className="grid grid-cols-1 gap-6 lg:grid-cols-5 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        style={{ animationDelay: '75ms', animationFillMode: 'both' }}
      >
        <div className="lg:col-span-2">
          <PloRadarChart
            radar={ploQuery.data.radar}
            threshold={curriculumQuery.data.defaultAchievementThreshold}
          />
        </div>
        <div className="lg:col-span-3">
          <PloInterpretationCard report={interpretation} />
        </div>
      </div>
    </DashboardShell>
  );
}
