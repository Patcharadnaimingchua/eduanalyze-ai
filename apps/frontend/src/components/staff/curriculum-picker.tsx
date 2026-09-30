'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchStaffOverview } from '@/lib/api/staff';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

// Options come from the staff overview (GET /dashboard/staff), which the
// backend already limits to the viewer's scope — the org list endpoints are
// public and return every curriculum in the system, which let staff pick
// something they could only read and then be refused on write. Sharing the
// ['staff-overview'] query with the dashboard means this is usually a cache
// hit.
export function CurriculumPicker({
  curriculumId,
  onSelect,
}: Readonly<{
  curriculumId: string | null;
  onSelect: (curriculumId: string) => void;
}>) {
  const overviewQuery = useQuery({ queryKey: ['staff-overview'], queryFn: fetchStaffOverview });
  const programs = useMemo(() => overviewQuery.data?.programs ?? [], [overviewQuery.data]);
  const [pickedProgramId, setPickedProgramId] = useState<string | undefined>();

  const owningProgram = programs.find((p) => p.curricula.some((c) => c.curriculumId === curriculumId));
  const programId = pickedProgramId ?? owningProgram?.programId ?? (programs.length === 1 ? programs[0].programId : undefined);
  const program = programs.find((p) => p.programId === programId);

  // Nothing to choose between -> choose it, so the common single-program /
  // single-version staff member lands straight on their categories.
  const soleCurriculumId = program?.curricula.length === 1 ? program.curricula[0].curriculumId : null;
  useEffect(() => {
    if (!curriculumId && soleCurriculumId) onSelect(soleCurriculumId);
    // onSelect is recreated every render by the page; only the ids matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curriculumId, soleCurriculumId]);

  if (overviewQuery.isLoading) return <Skeleton className="h-16 w-full" />;
  if (overviewQuery.isError) {
    return <p className="text-sm text-destructive">ไม่สามารถโหลดสาขาที่คุณดูแลได้ กรุณาลองใหม่อีกครั้ง</p>;
  }
  if (programs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        คุณยังไม่มีสาขาในความดูแล — กรุณาติดต่อผู้ดูแลระบบเพื่อกำหนดขอบเขตของคุณ
      </p>
    );
  }

  const outOfScope = curriculumId !== null && !owningProgram;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>สาขา</Label>
          <Select value={programId} onValueChange={setPickedProgramId}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกสาขา" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((p) => (
                <SelectItem key={p.programId} value={p.programId}>
                  {`${p.programCode} ${p.programName} · ${p.facultyName}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>ฉบับหลักสูตร</Label>
          <Select
            value={owningProgram && curriculumId ? curriculumId : undefined}
            onValueChange={onSelect}
            disabled={!program}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกฉบับหลักสูตร" />
            </SelectTrigger>
            <SelectContent>
              {(program?.curricula ?? []).map((c) => (
                <SelectItem key={c.curriculumId} value={c.curriculumId}>
                  {`${c.version} (พ.ศ. ${c.effectiveYear})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {outOfScope && (
        <p className="text-sm text-amber-600">
          หลักสูตรในลิงก์นี้อยู่นอกขอบเขตที่คุณดูแล — เลือกสาขาและฉบับจากรายการด้านบนแทน
        </p>
      )}
      {program && program.curricula.length === 0 && (
        <p className="text-sm text-muted-foreground">ยังไม่มีหลักสูตรในสาขานี้</p>
      )}
    </div>
  );
}
