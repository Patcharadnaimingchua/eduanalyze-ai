'use client';

import { useState } from 'react';
import { isAxiosError } from 'axios';
import type { CourseListItem, Prerequisite } from '@eduanalyze-ai/shared-types';
import { createPrerequisite, deletePrerequisite } from '@/lib/api/staff';
import { describeStaffWriteError } from '@/lib/describe-staff-write-error';
import { useToast } from '@/lib/toast-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { StaffCombobox } from './staff-combobox';

// The prerequisites of one course: remove one, or add another from the same
// curriculum. Each change is its own request, made when the button is pressed.
export function PrerequisiteEditor({
  course,
  coursesInCurriculum,
  prerequisites,
  onChanged,
}: Readonly<{
  course: CourseListItem;
  coursesInCurriculum: CourseListItem[];
  prerequisites: Prerequisite[];
  onChanged: () => void;
}>) {
  const toast = useToast();
  const [pickedId, setPickedId] = useState<string | undefined>();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pickerKey, setPickerKey] = useState(0);

  const courseById = new Map(coursesInCurriculum.map((c) => [c.id, c]));
  const own = prerequisites.filter((p) => p.courseId === course.id);
  const used = new Set(own.map((p) => p.prerequisiteCourseId));
  const options = coursesInCurriculum
    .filter((c) => c.id !== course.id && !used.has(c.id))
    .map((c) => ({
      value: c.id,
      label: `${c.code} — ${c.name}`,
      searchText: `${c.code} ${c.name}`,
    }));

  // Flow that writes: POST /prerequisites
  async function add() {
    if (!pickedId) {
      setServerError('กรุณาเลือกวิชาที่เป็นตัวก่อน');
      return;
    }
    setBusy(true);
    setServerError(null);
    try {
      await createPrerequisite({ courseId: course.id, prerequisiteCourseId: pickedId });
      toast.success('เพิ่มวิชาบังคับก่อนแล้ว');
      setPickedId(undefined);
      setPickerKey((k) => k + 1);
      onChanged();
    } catch (error) {
      setServerError(
        isAxiosError(error) && error.response?.status === 409
          ? 'วิชานี้เป็นวิชาบังคับก่อนของรายวิชานี้อยู่แล้ว'
          : describeStaffWriteError(error),
      );
    } finally {
      setBusy(false);
    }
  }

  // Flow that writes: DELETE /prerequisites/:id
  async function remove(id: string) {
    setBusy(true);
    setServerError(null);
    try {
      await deletePrerequisite(id);
      toast.success('ลบวิชาบังคับก่อนแล้ว');
      setConfirmingId(null);
      onChanged();
    } catch (error) {
      setServerError(describeStaffWriteError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="prerequisite-heading"
      className="space-y-3 border-t border-slate-200 pt-5"
    >
      <h3 id="prerequisite-heading" className="text-base font-semibold text-primary">
        วิชาบังคับก่อน
      </h3>
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {own.length === 0 ? (
        <p className="text-sm text-muted-foreground">ไม่มี</p>
      ) : (
        <ul className="space-y-2">
          {own.map((p) => {
            const c = courseById.get(p.prerequisiteCourseId);
            return (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2"
              >
                <span className="min-w-0 break-words text-sm">
                  <span className="font-semibold tabular-nums">{c?.code ?? '—'}</span>
                  {c && <span className="text-muted-foreground"> {c.name}</span>}
                </span>
                {confirmingId === p.id ? (
                  <span className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      className="px-3"
                      disabled={busy}
                      onClick={() => remove(p.id)}
                    >
                      ยืนยันลบ
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="px-3"
                      onClick={() => setConfirmingId(null)}
                    >
                      ยกเลิก
                    </Button>
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="danger"
                    className="min-w-11 px-3"
                    aria-label={`ลบวิชาบังคับก่อน ${c?.code ?? ''}`}
                    onClick={() => setConfirmingId(p.id)}
                  >
                    ลบ
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-2">
        <StaffCombobox
          key={pickerKey}
          options={options}
          value={pickedId}
          onValueChange={setPickedId}
          placeholder="เลือกวิชาที่เป็นตัวก่อน"
          searchPlaceholder="ค้นหารหัสวิชาหรือชื่อวิชา..."
          emptyText="ไม่พบวิชาที่ตรงกับคำค้นหา"
          aria-label="เลือกวิชาที่เป็นตัวก่อน"
        />
        <Button type="button" variant="outline" className="px-4" disabled={busy} onClick={add}>
          เพิ่มวิชาบังคับก่อน
        </Button>
      </div>
    </section>
  );
}
