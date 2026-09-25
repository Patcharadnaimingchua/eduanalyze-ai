'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import type { YearLevelBucket, YearLevelStudent } from '@eduanalyze-ai/shared-types';
import { Reveal } from '@/components/layout/reveal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Clickable year-level cards that expand into that year's student list.
// Role pages supply the data and optional per-card/per-row extras.
export function YearLevelOverview<T extends YearLevelStudent>({
  buckets,
  studentHref,
  renderCardExtra,
  renderStudentExtra,
}: Readonly<{
  buckets: YearLevelBucket<T>[];
  studentHref?: (student: T) => string;
  renderCardExtra?: (bucket: YearLevelBucket<T>) => ReactNode;
  renderStudentExtra?: (student: T) => ReactNode;
}>) {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const expandedBucket = buckets.find((b) => b.yearLevel === expandedLevel);

  return (
    <div className="space-y-4">
      <Reveal index={1}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {buckets.map((bucket) => {
            const isExpanded = expandedLevel === bucket.yearLevel;
            return (
              <button
                key={bucket.yearLevel}
                type="button"
                onClick={() => setExpandedLevel(isExpanded ? null : bucket.yearLevel)}
                className={cn(
                  'flex flex-col rounded-lg border p-4 text-left transition',
                  isExpanded ? 'border-brand bg-brand-light' : 'border-slate-200 hover:border-brand',
                )}
              >
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <GraduationCap className="h-4 w-4 text-brand" />
                  {bucket.label}
                </div>
                <p className="mt-2 text-2xl font-semibold text-primary">{bucket.students.length}</p>
                <p className="text-xs text-muted-foreground">คน</p>
                {renderCardExtra?.(bucket)}
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
            </CardHeader>
            <CardContent>
              {expandedBucket.students.length === 0 ? (
                <p className="text-sm text-muted-foreground">ไม่มีนักศึกษาในชั้นปีนี้</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                  {expandedBucket.students.map((s) => (
                    <li
                      key={s.studentProfileId}
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="text-muted-foreground">{s.studentCode}</span>{' '}
                        {studentHref ? (
                          <Link href={studentHref(s)} className="text-primary hover:underline">
                            {s.fullName}
                          </Link>
                        ) : (
                          <span className="text-primary">{s.fullName}</span>
                        )}
                      </span>
                      <span className="flex items-center gap-3">
                        {renderStudentExtra?.(s)}
                        <span className="text-xs text-muted-foreground">
                          เข้าศึกษาปี {s.admissionYear}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </Reveal>
      )}
    </div>
  );
}
