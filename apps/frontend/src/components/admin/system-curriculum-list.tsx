'use client';

import { FolderOpen, Users } from 'lucide-react';
import type { SystemCurriculumEntry } from '@eduanalyze-ai/shared-types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Three tiers, not one empty state. A curriculum nobody has enrolled in
// yet and a curriculum that was never built read very differently to
// whoever opens this page, and collapsing both into "0" makes a system
// that is merely young look like a system that is failing.
function StructureBadges({ curriculum }: { curriculum: SystemCurriculumEntry }) {
  return (
    <>
      <Badge tone="neutral">{curriculum.courseCount} วิชา</Badge>
      <Badge tone="neutral">{curriculum.cloCount} CLO</Badge>
      <Badge tone="neutral">{curriculum.ploCount} PLO</Badge>
    </>
  );
}

function CurriculumRow({ curriculum }: { curriculum: SystemCurriculumEntry }) {
  const { dataState } = curriculum;

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm">
      <span className="min-w-0">
        <span className="font-medium text-primary">{curriculum.programCode}</span>{' '}
        <span className="text-muted-foreground">ฉบับ {curriculum.version}</span>
        <span className="ml-2 text-xs text-muted-foreground">{curriculum.programName}</span>
      </span>
      <span className="flex flex-wrap items-center gap-2">
        {dataState === 'HAS_STUDENTS' ? (
          <>
            <Badge tone="success">{curriculum.studentCount} นักศึกษา</Badge>
            <Badge tone="neutral">
              GPA เฉลี่ย{' '}
              {curriculum.averageGpa === null ? '—' : curriculum.averageGpa.toFixed(2)}
            </Badge>
            <Badge tone="neutral">
              PLO เฉลี่ย{' '}
              {curriculum.averagePloValue === null
                ? '—'
                : `${Math.round(curriculum.averagePloValue)}%`}
            </Badge>
            <Badge tone={curriculum.studentsAtRiskCount > 0 ? 'danger' : 'neutral'}>
              เสี่ยง {curriculum.studentsAtRiskCount}
            </Badge>
            <Badge tone={curriculum.graduationReadyCount > 0 ? 'success' : 'neutral'}>
              พร้อมจบ {curriculum.graduationReadyCount}
            </Badge>
          </>
        ) : (
          <>
            <StructureBadges curriculum={curriculum} />
            <span className="text-xs text-muted-foreground">ยังไม่มีนักศึกษาในหลักสูตรนี้</span>
          </>
        )}
      </span>
    </li>
  );
}

export function SystemCurriculumList({ curricula }: { curricula: SystemCurriculumEntry[] }) {
  const active = curricula.filter((c) => c.dataState === 'HAS_STUDENTS');
  const structureOnly = curricula.filter((c) => c.dataState === 'STRUCTURE_ONLY');
  const empty = curricula.filter((c) => c.dataState === 'EMPTY');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">หลักสูตรที่มีนักศึกษา</CardTitle>
          <p className="text-xs text-muted-foreground">
            หลักสูตรที่มีข้อมูลผลการเรียนจริง จึงคำนวณ GPA และ PLO ได้
          </p>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users size={16} className="shrink-0 text-slate-300" aria-hidden="true" />
              ยังไม่มีหลักสูตรใดที่มีนักศึกษาลงทะเบียน
            </p>
          ) : (
            <ul className="space-y-2">
              {active.map((curriculum) => (
                <CurriculumRow key={curriculum.curriculumId} curriculum={curriculum} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {structureOnly.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
              จัดทำหลักสูตรแล้ว แต่ยังไม่มีนักศึกษา ({structureOnly.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              มีรายวิชาและ CLO/PLO ครบแล้ว รอการลงทะเบียนจึงจะวัดผลสัมฤทธิ์ได้
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {structureOnly.map((curriculum) => (
                <CurriculumRow key={curriculum.curriculumId} curriculum={curriculum} />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {empty.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderOpen size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
              ยังไม่ได้จัดทำหลักสูตร ({empty.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              ยังไม่มีรายวิชาหรือ CLO/PLO จึงไม่มีตัวเลขให้วิเคราะห์
            </p>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {empty.map((curriculum) => (
                <li
                  key={curriculum.curriculumId}
                  className="rounded-md bg-slate-50 px-3 py-1.5 text-sm text-muted-foreground"
                >
                  <span className="font-medium text-primary">{curriculum.programCode}</span>{' '}
                  ฉบับ {curriculum.version}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
