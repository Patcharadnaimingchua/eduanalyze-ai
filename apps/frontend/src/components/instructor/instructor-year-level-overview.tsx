'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import type { RiskLevel, YearLevelBucket } from '@eduanalyze-ai/shared-types';
import { RISK_LEVEL_LABELS, RISK_LEVEL_ORDER, RISK_LEVEL_TONES } from '@/lib/risk-level';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/layout/reveal';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const rank = (level: RiskLevel | undefined) => {
  const index = level ? RISK_LEVEL_ORDER.indexOf(level) : -1;
  return index === -1 ? RISK_LEVEL_ORDER.length : index;
};

// Instructor-only stand-in for the shared YearLevelOverview (which Staff also
// uses and must not change). Same idea — year cards that open that year's
// student list — plus the instructor's risk badges, and rows that are 44px
// tall links straight to that student on the students page. The risk map is
// null when the students report is unavailable; the page then simply shows
// no risk badges. Which year is open is plain component state, not the URL.
export function InstructorYearLevelOverview({
  buckets,
  riskById,
}: Readonly<{
  buckets: YearLevelBucket[];
  riskById: ReadonlyMap<string, RiskLevel> | null;
}>) {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const expandedBucket = buckets.find((b) => b.yearLevel === expandedLevel);

  return (
    <div className="space-y-4">
      <Reveal index={1}>
        {/* 4 columns only from xl: with the sidebar, lg leaves ~164px per card. */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {buckets.map((bucket) => {
            const isExpanded = expandedLevel === bucket.yearLevel;
            const behindCount = bucket.students.filter((s) => s.onTrackStatus === 'behind').length;
            const riskCount = (level: RiskLevel) =>
              bucket.students.filter((s) => riskById?.get(s.studentProfileId) === level).length;
            return (
              <button
                key={bucket.yearLevel}
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setExpandedLevel(isExpanded ? null : bucket.yearLevel)}
                className={cn(
                  'flex min-h-11 flex-col rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isExpanded ? 'border-brand bg-brand-light' : 'border-slate-200 hover:border-brand',
                )}
              >
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <GraduationCap className="h-4 w-4 text-brand" />
                  {bucket.label}
                </div>
                <p className="mt-2 text-2xl font-semibold text-primary">{bucket.students.length}</p>
                <p className="text-xs text-muted-foreground">คน</p>
                <div className="mt-2 flex flex-wrap gap-1.5 empty:hidden">
                  {(['CRITICAL', 'WATCH'] as const).map((level) =>
                    riskCount(level) > 0 ? (
                      <Badge key={level} tone={RISK_LEVEL_TONES[level]}>
                        {RISK_LEVEL_LABELS[level]} {riskCount(level)}
                      </Badge>
                    ) : null,
                  )}
                  {behindCount > 0 && <Badge tone="warning">หน่วยกิตน้อยกว่าที่ควรมี {behindCount}</Badge>}
                </div>
              </button>
            );
          })}
        </div>
      </Reveal>

      {expandedBucket && (
        <Reveal index={2}>
          <Card>
            <CardHeader>
              <CardTitle>รายชื่อนักศึกษา — {expandedBucket.label}</CardTitle>
              <p className="text-xs text-muted-foreground">
                ระดับความเสี่ยงนับเฉพาะวิชาที่คุณสอน กดชื่อเพื่อดูนักศึกษาคนนั้นในหน้านักศึกษา
              </p>
            </CardHeader>
            <CardContent>
              {expandedBucket.students.length === 0 ? (
                <p className="text-sm text-muted-foreground">ไม่มีนักศึกษาในชั้นปีนี้</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                  {[...expandedBucket.students]
                    .sort(
                      (a, b) =>
                        rank(riskById?.get(a.studentProfileId)) -
                        rank(riskById?.get(b.studentProfileId)),
                    )
                    .map((s) => {
                      const level = riskById?.get(s.studentProfileId);
                      return (
                        <li key={s.studentProfileId}>
                          <Link
                            href={`/instructor/students?q=${encodeURIComponent(s.studentCode)}`}
                            className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2 text-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <span className="min-w-0">
                              <span className="block text-primary">{s.fullName}</span>
                              <span className="block text-xs text-muted-foreground">
                                {s.studentCode} · เข้าศึกษาปี {s.admissionYear}
                              </span>
                            </span>
                            <span className="flex flex-wrap items-center gap-1.5">
                              {level && level !== 'NORMAL' && (
                                <Badge tone={RISK_LEVEL_TONES[level]}>{RISK_LEVEL_LABELS[level]}</Badge>
                              )}
                              {s.onTrackStatus === 'behind' && (
                                <Badge tone="warning">หน่วยกิตน้อยกว่าที่ควรมี</Badge>
                              )}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                </ul>
              )}
            </CardContent>
          </Card>
        </Reveal>
      )}
    </div>
  );
}
