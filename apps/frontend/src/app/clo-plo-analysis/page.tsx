'use client';

import { useMemo, useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SortMode = 'lowest' | 'highest' | 'code';

const SCORE_BANDS = [
  { key: 'excellent', label: 'ยอดเยี่ยม', minimum: 80, indicatorClassName: 'bg-emerald-600' },
  { key: 'good', label: 'ดี', minimum: 60, indicatorClassName: 'bg-emerald-500' },
  { key: 'fair', label: 'พอใช้', minimum: 40, indicatorClassName: 'bg-amber-500' },
  { key: 'needsWork', label: 'ควรพัฒนา', minimum: 0, indicatorClassName: 'bg-rose-500' },
] as const;

function scoreBandKey(value: number) {
  return SCORE_BANDS.find((band) => value >= band.minimum)!.key;
}

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
  const [sortMode, setSortMode] = useState<SortMode>('lowest');

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
      if (sortMode === 'highest') return b.value - a.value;
      if (sortMode === 'code') return a.code.localeCompare(b.code);
      return a.value - b.value;
    });
  }, [achievementQuery.data, sortMode]);

  const overallPercent = useMemo(() => {
    const values = (achievementQuery.data?.radar ?? [])
      .map((p) => p.value)
      .filter((v): v is number => v !== null);
    if (values.length === 0) return null;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }, [achievementQuery.data]);

  // Display-only grouping for the summary card. Raw achievement values,
  // curriculum threshold, and achieved/not-achieved logic remain unchanged.
  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(SCORE_BANDS.map((band) => [band.key, 0])) as Record<
      (typeof SCORE_BANDS)[number]['key'],
      number
    >;
    let noDataCount = 0;
    for (const plo of achievementQuery.data?.radar ?? []) {
      if (plo.value === null) {
        noDataCount += 1;
      } else {
        counts[scoreBandKey(plo.value)] += 1;
      }
    }
    return { counts, noDataCount };
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OverallAchievementCard percent={overallPercent} isAchieved={overallAchieved} />
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">สรุปตามสถานะ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {SCORE_BANDS.map((band) => (
              <div key={band.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className={`h-2 w-2 rounded-full ${band.indicatorClassName}`} aria-hidden="true" />
                  {band.label}
                </span>
                <span className="font-medium text-primary">{statusCounts.counts[band.key]} PLO</span>
              </div>
            ))}
            {statusCounts.noDataCount > 0 && (
              <p className="border-t border-slate-100 pt-3 text-xs text-muted-foreground">
                ไม่มีข้อมูล {statusCounts.noDataCount} PLO
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary">ผลการวิเคราะห์ราย PLO</h2>
            <p className="text-sm text-muted-foreground">คลิกแต่ละ PLO เพื่อดู CLO ที่เกี่ยวข้อง</p>
          </div>
          <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
            <SelectTrigger aria-label="เรียงลำดับ PLO" className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lowest">เรียง: ต้องพัฒนาก่อน</SelectItem>
              <SelectItem value="highest">เรียง: คะแนนสูงสุด</SelectItem>
              <SelectItem value="code">เรียงตาม PLO</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
      </section>
    </DashboardShell>
  );
}
