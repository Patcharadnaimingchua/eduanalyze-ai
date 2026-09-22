'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchActualCloAchievement } from '@/lib/api/assessment-evidence';
import { Button } from '@/components/ui/button';
import { AchievementSourceBadge } from './achievement-source-badge';
import { EvidenceCoverageBadge } from './evidence-coverage-badge';

// The evidence-based number for one student on one CLO, aggregated by the
// backend across every assessment feeding that CLO — so it answers a wider
// question than the single mapping being edited in this panel.
//
// On demand rather than per row on load: this is one request per student, and
// firing it for a full roster would be dozens of requests to render a table.
export function StudentActualCloCell({
  courseId,
  cloId,
  studentCourseRecordId,
}: Readonly<{
  courseId: string;
  cloId: string;
  studentCourseRecordId: string;
}>) {
  const [shown, setShown] = useState(false);

  const query = useQuery({
    queryKey: ['actual-clo-achievement', courseId, studentCourseRecordId, cloId],
    queryFn: () => fetchActualCloAchievement(courseId, studentCourseRecordId, cloId),
    enabled: shown,
  });

  if (!shown) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setShown(true)}>
        ดูผลรวม CLO
      </Button>
    );
  }
  if (query.isLoading) {
    return <span className="text-xs text-muted-foreground">กำลังคำนวณ...</span>;
  }
  if (query.isError || !query.data) {
    return <span className="text-xs text-destructive">โหลดไม่สำเร็จ</span>;
  }

  const { score, source, coverage } = query.data;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* score is a Decimal string, and null means no usable evidence — never
          render that as 0, which would read as "scored zero". */}
      <span className="text-sm font-medium text-primary">
        {score === null ? 'ไม่มีข้อมูล' : `${Number(score).toFixed(1)}%`}
      </span>
      <AchievementSourceBadge source={source} />
      <EvidenceCoverageBadge coverage={coverage} />
    </div>
  );
}
