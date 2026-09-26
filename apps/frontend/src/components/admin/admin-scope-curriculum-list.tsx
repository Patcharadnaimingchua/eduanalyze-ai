'use client';

import { FolderOpen, Users } from 'lucide-react';
import type { AdminScopeCurriculumEntry } from '@eduanalyze-ai/shared-types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Scoped, counts-only counterpart to SystemCurriculumList (SUPER_ADMIN's
// system-wide dashboard) — AdminScopeCurriculumEntry carries no GPA/radar
// fields, so each row shows structure counts only, same 3-tier grouping.
function CurriculumRow({ curriculum }: { curriculum: AdminScopeCurriculumEntry }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm">
      <span className="min-w-0">
        <span className="font-medium text-primary">{curriculum.programCode}</span>{' '}
        <span className="text-muted-foreground">ฉบับ {curriculum.version}</span>
        <span className="ml-2 text-xs text-muted-foreground">{curriculum.programName}</span>
      </span>
      <span className="flex flex-wrap items-center gap-2">
        {curriculum.dataState === 'HAS_STUDENTS' && (
          <Badge tone="success">{curriculum.studentCount} นักศึกษา</Badge>
        )}
        <Badge tone="neutral">{curriculum.courseCount} วิชา</Badge>
        <Badge tone="neutral">{curriculum.ploCount} PLO</Badge>
      </span>
    </li>
  );
}

export function AdminScopeCurriculumList({
  curricula,
}: {
  curricula: AdminScopeCurriculumEntry[];
}) {
  const active = curricula.filter((c) => c.dataState === 'HAS_STUDENTS');
  const structureOnly = curricula.filter((c) => c.dataState === 'STRUCTURE_ONLY');
  const empty = curricula.filter((c) => c.dataState === 'EMPTY');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>หลักสูตรที่มีนักศึกษา</CardTitle>
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
            <CardTitle className="flex items-center gap-2">
              <Users size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
              จัดทำหลักสูตรแล้ว แต่ยังไม่มีนักศึกษา ({structureOnly.length})
            </CardTitle>
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
            <CardTitle className="flex items-center gap-2">
              <FolderOpen size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
              ยังไม่ได้จัดทำหลักสูตร ({empty.length})
            </CardTitle>
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
