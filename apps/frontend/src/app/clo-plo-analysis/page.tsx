'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOwnStudentProfile } from '@/lib/api/dashboard';
import {
  fetchCurriculum,
  fetchPlos,
  fetchStudentPloAchievement,
} from '@/lib/api/plo-achievement';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { OverallAchievementCard } from '@/components/clo-plo-analysis/overall-achievement-card';
import { PloCard } from '@/components/clo-plo-analysis/plo-card';

export default function CloPloAnalysisPage() {
  return (
    <ProtectedRoute>
      <CloPloAnalysisContent />
    </ProtectedRoute>
  );
}

function CloPloAnalysisContent() {
  const { user } = useAuth();
  const isStudent = !!user?.roles.includes('STUDENT');

  const profileQuery = useQuery({
    queryKey: ['student-profile-me'],
    queryFn: fetchOwnStudentProfile,
    enabled: isStudent,
  });
  const studentProfileId = profileQuery.data?.id;
  const curriculumId = profileQuery.data?.curriculumId;

  const achievementQuery = useQuery({
    queryKey: ['student-plo-achievement', studentProfileId],
    queryFn: () => fetchStudentPloAchievement(studentProfileId!),
    enabled: !!studentProfileId,
  });
  const plosQuery = useQuery({ queryKey: ['plos'], queryFn: fetchPlos, enabled: !!studentProfileId });
  const curriculumQuery = useQuery({
    queryKey: ['curriculum', curriculumId],
    queryFn: () => fetchCurriculum(curriculumId!),
    enabled: !!curriculumId,
  });

  const descriptionByPloId = useMemo(
    () => new Map((plosQuery.data ?? []).map((p) => [p.id, p.description])),
    [plosQuery.data],
  );

  const threshold = curriculumQuery.data?.defaultAchievementThreshold ?? null;

  // Lowest achievement first — surfaces what needs work before what's
  // already fine. PLOs with no data (null) go last: "no data" isn't the
  // same signal as "needs improvement", so it shouldn't compete for the
  // top of the list.
  const sortedRadar = useMemo(() => {
    const radar = achievementQuery.data?.radar ?? [];
    return [...radar].sort((a, b) => {
      if (a.value === null && b.value === null) return 0;
      if (a.value === null) return 1;
      if (b.value === null) return -1;
      return a.value - b.value;
    });
  }, [achievementQuery.data]);

  const overallPercent = useMemo(() => {
    const values = (achievementQuery.data?.radar ?? [])
      .map((p) => p.value)
      .filter((v): v is number => v !== null);
    if (values.length === 0) return null;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }, [achievementQuery.data]);

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

  const isLoading =
    profileQuery.isLoading || achievementQuery.isLoading || plosQuery.isLoading || curriculumQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (
    profileQuery.isError ||
    achievementQuery.isError ||
    plosQuery.isError ||
    curriculumQuery.isError ||
    !profileQuery.data ||
    !achievementQuery.data
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>
      </div>
    );
  }

  const overallAchieved = threshold !== null && overallPercent !== null && overallPercent >= threshold;

  return (
    <DashboardShell studentCode={profileQuery.data.studentCode} fullName={user.fullName}>
      <div>
        <h1 className="text-2xl font-semibold text-primary">การวิเคราะห์ CLO/PLO</h1>
        <p className="text-sm text-muted-foreground">
          ความสำเร็จของผลลัพธ์การเรียนรู้ระดับหลักสูตร (PLO) จากผลการเรียนของคุณ
        </p>
      </div>

      <div
        className="grid grid-cols-1 gap-6 lg:grid-cols-3 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        style={{ animationDelay: '75ms', animationFillMode: 'both' }}
      >
        <OverallAchievementCard percent={overallPercent} isAchieved={overallAchieved} />
      </div>

      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        style={{ animationDelay: '150ms', animationFillMode: 'both' }}
      >
        {sortedRadar.map((plo) => (
          <PloCard
            key={plo.ploId}
            plo={plo}
            description={descriptionByPloId.get(plo.ploId) ?? null}
            isAchieved={threshold !== null && plo.value !== null && plo.value >= threshold}
            threshold={threshold}
          />
        ))}
      </div>
    </DashboardShell>
  );
}
