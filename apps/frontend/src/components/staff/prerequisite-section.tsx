'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import type { CourseListItem, Prerequisite } from '@eduanalyze-ai/shared-types';
import { createPrerequisite, deletePrerequisite, fetchPrerequisites } from '@/lib/api/staff';
import { prerequisiteSchema, type PrerequisiteFormValues } from '@/lib/validation/prerequisite.schema';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';

export function PrerequisiteSection({
  courseId,
  coursesInCurriculum,
}: {
  courseId: string;
  coursesInCurriculum: CourseListItem[];
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const prerequisitesQuery = useQuery({ queryKey: ['prerequisites'], queryFn: fetchPrerequisites });
  const courseMap = new Map(coursesInCurriculum.map((c) => [c.id, c]));

  const ownPrerequisites = (prerequisitesQuery.data ?? []).filter((p) => p.courseId === courseId);
  const usedIds = new Set(ownPrerequisites.map((p) => p.prerequisiteCourseId));
  const options: ComboboxOption[] = coursesInCurriculum
    .filter((c) => c.id !== courseId && !usedIds.has(c.id))
    .map((c) => ({ value: c.id, label: `${c.code} — ${c.name}`, searchText: `${c.code} ${c.name}` }));

  const form = useForm<PrerequisiteFormValues>({
    resolver: zodResolver(prerequisiteSchema),
    defaultValues: { prerequisiteCourseId: '' },
  });

  async function onSubmit(values: PrerequisiteFormValues) {
    setServerError(null);
    try {
      await createPrerequisite({ courseId, prerequisiteCourseId: values.prerequisiteCourseId });
      form.reset({ prerequisiteCourseId: '' });
      prerequisitesQuery.refetch();
    } catch {
      setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setServerError(null);
    try {
      await deletePrerequisite(id);
      setConfirmingId(null);
      prerequisitesQuery.refetch();
    } catch {
      setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {ownPrerequisites.length === 0 ? (
        <p className="text-sm text-muted-foreground">ยังไม่มีวิชาที่เป็นตัวก่อน</p>
      ) : (
        <ul className="space-y-2">
          {ownPrerequisites.map((prerequisite: Prerequisite) => {
            const course = courseMap.get(prerequisite.prerequisiteCourseId);
            return (
              <li
                key={prerequisite.id}
                className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
              >
                <span>{course ? `${course.code} — ${course.name}` : prerequisite.prerequisiteCourseId}</span>
                {confirmingId === prerequisite.id ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={busyId === prerequisite.id}
                      onClick={() => handleDelete(prerequisite.id)}
                    >
                      ยืนยัน
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setConfirmingId(null)}>
                      ยกเลิก
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingId(prerequisite.id)}>
                    ลบ
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-3 border-t border-slate-100 pt-3">
          <FormField
            control={form.control}
            name="prerequisiteCourseId"
            render={({ field }) => (
              <FormItem className="w-72">
                <FormControl>
                  <Combobox
                    options={options}
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    placeholder="เลือกวิชาที่เป็นตัวก่อน"
                    searchPlaceholder="ค้นหารหัสวิชาหรือชื่อวิชา..."
                    emptyText="ไม่พบวิชาที่ตรงกับคำค้นหา"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" variant="outline" size="sm" disabled={form.formState.isSubmitting}>
            เพิ่ม
          </Button>
        </form>
      </Form>
    </div>
  );
}
