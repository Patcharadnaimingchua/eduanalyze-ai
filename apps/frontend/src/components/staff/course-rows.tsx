'use client';

import { useEffect, useRef, useState } from 'react';
import { Pencil, Plus, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CourseRowData } from './curriculum-view';

export interface CourseRowActions {
  onEdit?: (row: CourseRowData) => void;
  onAssign?: (row: CourseRowData) => void;
  // Resolves when the assignment is gone; the row stays as it is if it rejects.
  onWithdraw?: (assignmentId: string) => Promise<void>;
}

const NO_INSTRUCTOR_BADGE =
  'inline-flex min-h-7 items-center gap-1.5 rounded border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-700';

function Instructors({
  row,
  actions,
  compact,
}: Readonly<{
  row: CourseRowData;
  actions: CourseRowActions;
  compact?: boolean;
}>) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { instructors } = row;

  async function withdraw(assignmentId: string) {
    if (!actions.onWithdraw) return;
    setBusyId(assignmentId);
    try {
      await actions.onWithdraw(assignmentId);
      setConfirmingId(null);
    } catch {
      setConfirmingId(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={cn('space-y-2', compact && 'w-full')}>
      {instructors.length === 0 && (
        <span className={NO_INSTRUCTOR_BADGE}>
          <UserX aria-hidden="true" className="h-3.5 w-3.5" />
          ยังไม่มีอาจารย์
        </span>
      )}
      {instructors.length > 0 && (
        <ul className="space-y-2">
          {instructors.map((instructor) => (
            <li
              key={instructor.assignmentId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-1.5"
            >
              <span className="min-w-0 break-words text-sm font-medium">{instructor.name}</span>
              {actions.onWithdraw &&
                (confirmingId === instructor.assignmentId ? (
                  <span className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      className="h-11 px-3"
                      disabled={busyId === instructor.assignmentId}
                      aria-label={`ยืนยันถอน ${instructor.name} ออกจาก ${row.course.code}`}
                      onClick={() => withdraw(instructor.assignmentId)}
                    >
                      ยืนยันถอน
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 px-3"
                      onClick={() => setConfirmingId(null)}
                    >
                      ยกเลิก
                    </Button>
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-3 text-destructive"
                    aria-label={`ถอน ${instructor.name} ออกจาก ${row.course.code}`}
                    onClick={() => setConfirmingId(instructor.assignmentId)}
                  >
                    ถอนอาจารย์
                  </Button>
                ))}
            </li>
          ))}
        </ul>
      )}
      {actions.onAssign && (
        <Button
          type="button"
          variant={instructors.length === 0 ? 'default' : 'outline'}
          className="h-11 gap-1.5 px-3"
          aria-label={`มอบหมายอาจารย์ให้ ${row.course.code}`}
          onClick={() => actions.onAssign?.(row)}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          {instructors.length === 0 ? 'มอบหมายอาจารย์' : 'มอบหมาย'}
        </Button>
      )}
    </div>
  );
}

function Prerequisites({ codes }: { codes: string[] }) {
  if (codes.length === 0) return <span className="text-muted-foreground">ไม่มี</span>;
  return <span className="break-words font-medium tabular-nums">{codes.join(' · ')}</span>;
}

function EditButton({ row, actions }: { row: CourseRowData; actions: CourseRowActions }) {
  if (!actions.onEdit) return null;
  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 gap-1.5 px-3"
      aria-label={`แก้ไขรายวิชา ${row.course.code}`}
      onClick={() => actions.onEdit?.(row)}
    >
      <Pencil aria-hidden="true" className="h-4 w-4" />
      แก้ไขรายวิชา
    </Button>
  );
}

// A table from md up and a stack of cards below it; both read the same rows.
export function CourseRows({
  rows,
  selectedCourseId,
  actions,
}: Readonly<{
  rows: CourseRowData[];
  selectedCourseId: string | null;
  actions: CourseRowActions;
}>) {
  // The table and the cards both carry the selected course; scroll to the one
  // that is actually on screen.
  useEffect(() => {
    if (!selectedCourseId) return;
    const visible = [...document.querySelectorAll<HTMLElement>('[data-selected-course]')].find(
      (el) => el.offsetParent !== null,
    );
    visible?.scrollIntoView({ block: 'center', behavior: 'auto' });
  }, [selectedCourseId, rows.length]);

  if (rows.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-sm text-muted-foreground">
        ไม่พบรายวิชาที่ตรงกับเงื่อนไขที่เลือก
      </p>
    );
  }

  const highlight = (id: string) =>
    id === selectedCourseId ? 'bg-brand-light/40 ring-2 ring-inset ring-brand' : '';
  const mark = (id: string) => (id === selectedCourseId ? { 'data-selected-course': '' } : {});

  return (
    <>
      <table className="hidden w-full text-left text-sm md:table">
        <thead>
          <tr className="border-y-2 border-slate-200 bg-slate-50 text-xs text-muted-foreground">
            <th className="px-3 py-3 font-semibold">รหัสวิชา</th>
            <th className="px-3 py-3 font-semibold">ชื่อรายวิชา (ภาษาไทยและภาษาอังกฤษ)</th>
            <th className="px-3 py-3 text-right font-semibold">หน่วยกิต</th>
            <th className="px-3 py-3 font-semibold">วิชาบังคับก่อน</th>
            <th className="px-3 py-3 font-semibold">อาจารย์ผู้รับผิดชอบวิชา (ระดับหลักสูตร)</th>
            {actions.onEdit && <th className="px-3 py-3 font-semibold">การดำเนินการ</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.course.id}
              {...mark(row.course.id)}
              className={cn(
                'border-b border-slate-100 align-top hover:bg-slate-50',
                highlight(row.course.id),
              )}
            >
              <td className="px-3 py-3 font-semibold tabular-nums">{row.course.code}</td>
              <td className="px-3 py-3">
                <p className="break-words font-semibold">{row.course.name}</p>
                {row.course.nameEn && (
                  <p className="break-words text-xs text-muted-foreground">{row.course.nameEn}</p>
                )}
              </td>
              <td className="px-3 py-3 text-right tabular-nums">{row.course.credits}</td>
              <td className="px-3 py-3">
                <Prerequisites codes={row.prerequisiteCodes} />
              </td>
              <td className="px-3 py-3">
                <Instructors row={row} actions={actions} />
              </td>
              {actions.onEdit && (
                <td className="px-3 py-3">
                  <EditButton row={row} actions={actions} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="space-y-3 p-4 md:hidden">
        {rows.map((row) => (
          <li
            key={row.course.id}
            {...mark(row.course.id)}
            className={cn(
              'space-y-3 rounded-lg border border-slate-200 bg-card p-4',
              highlight(row.course.id),
            )}
          >
            <div>
              <p className="font-semibold tabular-nums">{row.course.code}</p>
              <p className="break-words font-semibold">{row.course.name}</p>
              {row.course.nameEn && (
                <p className="break-words text-xs text-muted-foreground">{row.course.nameEn}</p>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">หน่วยกิต</dt>
                <dd className="tabular-nums">{row.course.credits}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">วิชาบังคับก่อน</dt>
                <dd>
                  <Prerequisites codes={row.prerequisiteCodes} />
                </dd>
              </div>
            </dl>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">อาจารย์ผู้รับผิดชอบวิชา</p>
              <Instructors row={row} actions={actions} compact />
            </div>
            <EditButton row={row} actions={actions} />
          </li>
        ))}
      </ul>
    </>
  );
}
