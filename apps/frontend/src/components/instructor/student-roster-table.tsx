'use client';

import { useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { Download, Search } from 'lucide-react';
import type {
  CloAchievementEntry,
  Grade,
  RiskLevel,
  StudentRosterEntry,
} from '@eduanalyze-ai/shared-types';
import { deleteCourseRecord, updateCourseRecordGrade } from '@/lib/api/academic-record';
import { gradeBadgeTone } from '@/lib/grade-badge-color';
import { GRADE_LABELS, GRADE_OPTIONS } from '@/lib/grade-label';
import { RISK_LEVEL_LABELS, RISK_LEVEL_ORDER, RISK_LEVEL_TONES } from '@/lib/risk-level';
import { downloadCsv, toCsv } from '@/lib/csv';
import { useToast } from '@/lib/toast-context';
import { usePagination } from '@/lib/use-pagination';
import { useTableSort } from '@/lib/use-table-sort';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortHeader } from '@/components/ui/sort-header';
import { TableSkeleton } from '@/components/ui/skeleton';
import { StudentTimelineCard } from './student-timeline-card';

// Radix reserves the empty string as a SelectItem value, so "no filter"
// needs a sentinel of its own.
const ALL_RISK_LEVELS = 'ALL';

// Exports what the table currently shows, not the whole class — the
// filename says so, otherwise a filtered export is indistinguishable
// from a complete roster once it is off the screen.
function exportRosterCsv(
  courseCode: string,
  rows: StudentRosterEntry[],
  isFiltered: boolean,
) {
  const csv = toCsv(
    ['รหัสนักศึกษา', 'ชื่อ-นามสกุล', 'เกรด', 'สถานะเสี่ยง'],
    rows.map((student) => [
      student.studentCode,
      student.fullName,
      GRADE_LABELS[student.grade],
      student.riskLevel === 'NORMAL' ? '' : RISK_LEVEL_LABELS[student.riskLevel],
    ]),
  );
  const today = new Date().toISOString().slice(0, 10);
  downloadCsv(`gradebook-${courseCode}-${today}${isFiltered ? '-filtered' : ''}.csv`, csv);
}

// downloadCsv's Blob/URL.createObjectURL path can throw in constrained
// environments (e.g. an iframe sandbox) — this had no feedback at all
// before, success or failure.
function exportRosterCsvWithToast(
  courseCode: string,
  rows: StudentRosterEntry[],
  isFiltered: boolean,
  toast: ReturnType<typeof useToast>,
) {
  try {
    exportRosterCsv(courseCode, rows, isFiltered);
    toast.success('ส่งออก CSV แล้ว');
  } catch {
    toast.error('ส่งออก CSV ไม่สำเร็จ');
  }
}

function describeWriteError(error: unknown) {
  if (isAxiosError(error)) {
    if (error.response?.status === 403) return 'คุณไม่มีสิทธิ์แก้ไขผลการเรียนของรายวิชานี้';
    if (error.response?.status === 404) return 'ไม่พบรายการนี้แล้ว อาจถูกลบไปก่อนหน้า';
  }
  return 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
}

// Read-only when onChanged is omitted. Rows are each student's latest
// attempt only, so removing one can surface an earlier attempt in its place.
export function StudentRosterTable({
  courseId,
  courseCode,
  clos,
  roster,
  isLoading,
  isError,
  onChanged,
}: {
  courseId: string;
  courseCode: string;
  clos: CloAchievementEntry[];
  roster: StudentRosterEntry[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onChanged?: () => void;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | typeof ALL_RISK_LEVELS>(
    ALL_RISK_LEVELS,
  );
  const editable = !!onChanged;

  const visibleRoster = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (roster ?? []).filter(
      (student) =>
        (riskFilter === ALL_RISK_LEVELS || student.riskLevel === riskFilter) &&
        (term === '' ||
          student.studentCode.toLowerCase().includes(term) ||
          student.fullName.toLowerCase().includes(term)),
    );
  }, [roster, search, riskFilter]);

  const isFiltered = search.trim() !== '' || riskFilter !== ALL_RISK_LEVELS;

  const sort = useTableSort(visibleRoster, {
    studentCode: (s) => s.studentCode,
    fullName: (s) => s.fullName,
    grade: (s) => GRADE_OPTIONS.indexOf(s.grade),
    risk: (s) => RISK_LEVEL_ORDER.indexOf(s.riskLevel),
  });
  const pagination = usePagination(
    sort.sorted,
    undefined,
    `${search}|${riskFilter}|${sort.sortKey}|${sort.direction}`,
  );

  // A row left awaiting delete-confirmation must not stay armed once it
  // has scrolled to another page or moved under a re-sort.
  useEffect(() => {
    setConfirmingId(null);
  }, [pagination.page, sort.sortKey, sort.direction]);

  // The timeline card is opened from a row, so it has to close when that
  // row is filtered away — otherwise it hangs below the table with no
  // visible student to tie it back to.
  useEffect(() => {
    if (
      selectedStudentId &&
      !visibleRoster.some((s) => s.studentProfileId === selectedStudentId)
    ) {
      setSelectedStudentId(null);
    }
  }, [visibleRoster, selectedStudentId]);

  async function runWrite(
    recordId: string,
    action: () => Promise<unknown>,
    successMessage: string,
  ) {
    setBusyId(recordId);
    try {
      await action();
      setConfirmingId(null);
      onChanged?.();
      toast.success(successMessage);
    } catch (error) {
      toast.error(describeWriteError(error));
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) {
    return <TableSkeleton cols={5} rows={4} />;
  }
  if (isError || !roster) {
    return <p className="text-sm text-destructive">ไม่สามารถโหลดรายชื่อนักศึกษาได้</p>;
  }
  if (roster.length === 0) {
    return <p className="text-sm text-muted-foreground">ยังไม่มีนักศึกษาลงทะเบียนในรายวิชานี้</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        {editable ? (
          <p className="text-xs text-muted-foreground">
            นักศึกษาเป็นผู้บันทึกผลการเรียนเอง — ใช้หน้านี้เพื่อแก้ไขกรณีเกรดผิดเท่านั้น
            แสดงเฉพาะผลการเรียนครั้งล่าสุดของแต่ละคน
          </p>
        ) : (
          <div />
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={visibleRoster.length === 0}
          onClick={() => exportRosterCsvWithToast(courseCode, sort.sorted, isFiltered, toast)}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          ส่งออก CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหารหัสนักศึกษา หรือ ชื่อ"
            className="h-9 pl-9"
          />
        </div>
        <Select
          value={riskFilter}
          onValueChange={(value) => setRiskFilter(value as RiskLevel | typeof ALL_RISK_LEVELS)}
        >
          <SelectTrigger className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_RISK_LEVELS}>ทุกระดับ</SelectItem>
            {RISK_LEVEL_ORDER.map((level) => (
              <SelectItem key={level} value={level}>
                {RISK_LEVEL_LABELS[level]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isFiltered && (
          <p className="text-xs text-muted-foreground">
            แสดง {visibleRoster.length} จาก {roster.length} คน
          </p>
        )}
      </div>

      {/* Two columns only once a student is picked, so an unselected table
          keeps the full width. minmax(0,1fr) rather than 1fr: a 1fr track
          defaults to min-width:auto, which would let the wide table push
          the panel off screen instead of scrolling inside its own box. */}
      <div
        className={cn(
          'grid gap-4',
          selectedStudentId && 'lg:grid-cols-[minmax(0,1fr)_340px]',
        )}
      >
        {/* overflow-x-auto sits on an inner div so the pagination bar below
            it does not scroll sideways with a wide table. */}
        <div className="min-w-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-muted-foreground">
                  <SortHeader {...sort.sortProps('studentCode')}>รหัสนักศึกษา</SortHeader>
                  <SortHeader {...sort.sortProps('fullName')}>ชื่อ-นามสกุล</SortHeader>
                  <SortHeader {...sort.sortProps('grade')}>เกรด</SortHeader>
                  <SortHeader {...sort.sortProps('risk')}>ความเสี่ยง</SortHeader>
                  {editable && <th className="py-2 font-medium">การจัดการ</th>}
                </tr>
              </thead>
              <tbody>
                {pagination.pageRows.map((student) => {
                  const recordId = student.studentCourseRecordId;
                  const isBusy = busyId === recordId;
                  const isSelected = selectedStudentId === student.studentProfileId;

                  return (
                    <tr
                      key={student.studentProfileId}
                      className={cn(
                        'border-b border-slate-50',
                        // Ungated, the hover grey would win over the selected
                        // row's brand-light (Tailwind emits hover: variants
                        // after base utilities).
                        !isSelected && 'hover:bg-slate-50',
                        isSelected && 'bg-brand-light',
                      )}
                    >
                      <td className="py-2 pr-4 text-muted-foreground">{student.studentCode}</td>
                      <td className="py-2 pr-4">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedStudentId(isSelected ? null : student.studentProfileId)
                          }
                          className={cn(
                            'text-primary hover:underline',
                            isSelected && 'font-medium underline',
                          )}
                        >
                          {student.fullName}
                        </button>
                      </td>
                      <td className="py-2 pr-4">
                        {editable ? (
                          <Select
                            value={student.grade}
                            onValueChange={(value) =>
                              runWrite(
                                recordId,
                                () => updateCourseRecordGrade(recordId, { grade: value as Grade }),
                                'บันทึกเกรดแล้ว',
                              )
                            }
                            disabled={isBusy}
                          >
                            <SelectTrigger className="h-8 w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {GRADE_OPTIONS.map((g) => (
                                <SelectItem key={g} value={g}>
                                  {GRADE_LABELS[g]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge tone={gradeBadgeTone(student.grade)}>{GRADE_LABELS[student.grade]}</Badge>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge tone={RISK_LEVEL_TONES[student.riskLevel]}>
                          {RISK_LEVEL_LABELS[student.riskLevel]}
                        </Badge>
                      </td>
                      {editable && (
                        <td className="py-2">
                          {confirmingId === recordId ? (
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                disabled={isBusy}
                                onClick={() =>
                                  runWrite(
                                    recordId,
                                    () => deleteCourseRecord(recordId),
                                    'ลบผลการเรียนแล้ว',
                                  )
                                }
                              >
                                ยืนยันลบ
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => setConfirmingId(null)}
                              >
                                ยกเลิก
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => setConfirmingId(recordId)}
                            >
                              ลบ
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibleRoster.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">
                ไม่พบนักศึกษาที่ตรงกับเงื่อนไขที่เลือก
              </p>
            )}
          </div>
          <Pagination {...pagination} onPageChange={pagination.setPage} />
        </div>
        {/* self-start stops the grid stretching this cell to the row
            height, which would leave sticky with nothing to scroll past. */}
        {selectedStudentId &&
          (() => {
            const selected = visibleRoster.find((s) => s.studentProfileId === selectedStudentId);
            if (!selected) return null;
            return (
              <div className="lg:sticky lg:top-4 lg:self-start">
                <StudentTimelineCard
                  courseId={courseId}
                  courseCode={courseCode}
                  studentProfileId={selectedStudentId}
                  studentCourseRecordId={selected.studentCourseRecordId}
                  clos={clos}
                  onClose={() => setSelectedStudentId(null)}
                />
              </div>
            );
          })()}
      </div>
    </div>
  );
}
