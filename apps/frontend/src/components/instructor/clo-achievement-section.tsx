'use client';

import { useMemo } from 'react';
import type { CloAchievementEntry, CoursePloEntry, CourseCloAchievementReport } from '@eduanalyze-ai/shared-types';
import { ploProgressBarColorClassName } from '@/lib/plo-color';
import { formatFiveScale, percentToFiveScale } from '@/lib/five-scale';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { achievementBadgeTone } from '@/lib/achievement-color';

interface CourseAssessmentSummary {
  courseId: string;
  submissionCount: number;
  clos: { cloId: string; code: string; averageScore: number | null; scoreCount: number }[];
}

export function CloAchievementSection({
  achievementPercent,
  clos,
  plos,
  courseAssessment,
  detail,
  isLoading,
  isError,
}: {
  achievementPercent: number;
  clos: CloAchievementEntry[];
  plos: CoursePloEntry[];
  courseAssessment: CourseAssessmentSummary;
  detail: CourseCloAchievementReport | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  const scoredAssessmentClos = useMemo(
    () => courseAssessment.clos.filter((c) => c.averageScore !== null && c.scoreCount > 0),
    [courseAssessment.clos],
  );
  const lowestAssessmentCloId = useMemo(
    () =>
      scoredAssessmentClos.length === 0
        ? null
        : scoredAssessmentClos.reduce((min, c) => (c.averageScore! < min.averageScore! ? c : min)).cloId,
    [scoredAssessmentClos],
  );
  const highestAssessmentCloId = useMemo(
    () =>
      scoredAssessmentClos.length === 0
        ? null
        : scoredAssessmentClos.reduce((max, c) => (c.averageScore! > max.averageScore! ? c : max)).cloId,
    [scoredAssessmentClos],
  );

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Progress value={achievementPercent} className="flex-1" barClassName="bg-emerald-600" />
          <Badge tone={achievementBadgeTone(achievementPercent)}>
            {formatFiveScale(achievementPercent)}
          </Badge>
        </div>
        {isLoading && <p className="text-xs text-muted-foreground">กำลังโหลดจำนวนนักศึกษา...</p>}
        {isError && (
          <p className="text-xs text-destructive">ไม่สามารถโหลดจำนวนนักศึกษาที่ผ่านเกณฑ์ได้</p>
        )}
        {detail && (
          <p className="text-xs text-muted-foreground">
            {detail.achievedStudents} จาก {detail.totalStudents} คนผ่านเกณฑ์
          </p>
        )}
      </div>

      <div className="space-y-2">
        {clos.map((clo) => (
          <div
            key={clo.cloId}
            className="flex items-start justify-between gap-3 rounded-md bg-slate-50 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">{clo.code}</p>
              <p className="text-sm text-primary">{clo.description}</p>
              <p className="text-xs text-muted-foreground">
                เกณฑ์ผ่าน ≥ {percentToFiveScale(clo.threshold).toFixed(1)}
              </p>
            </div>
            <Badge tone={clo.isAchieved ? 'green' : 'amber'}>
              {clo.isAchieved ? 'Achieved' : 'Not Achieved'}
            </Badge>
          </div>
        ))}
      </div>

      {plos.length > 0 && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <p className="text-sm font-medium text-primary">PLO ที่เกี่ยวข้อง</p>
          {plos.map((plo) => (
            <div key={plo.ploId} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {plo.code} · {plo.name}
                </span>
                <span className="font-medium text-primary">
                  {formatFiveScale(plo.achievementPercent)}
                </span>
              </div>
              <Progress
                value={plo.achievementPercent}
                barClassName={ploProgressBarColorClassName(plo.achievementPercent, null)}
              />
            </div>
          ))}
        </div>
      )}

      {scoredAssessmentClos.length > 0 && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <p className="text-sm font-medium text-primary">
            คะแนนประเมินตนเองเฉลี่ยต่อ CLO (1-5)
          </p>
          {scoredAssessmentClos.map((c) => (
            <div key={c.cloId} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {c.code}
                {c.cloId === highestAssessmentCloId && (
                  <span className="ml-1.5 text-xs text-emerald-600">(สูงสุด)</span>
                )}
                {c.cloId === lowestAssessmentCloId && c.cloId !== highestAssessmentCloId && (
                  <span className="ml-1.5 text-xs text-amber-600">(ต่ำสุด)</span>
                )}
              </span>
              <span className="font-medium text-primary">{c.averageScore!.toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
