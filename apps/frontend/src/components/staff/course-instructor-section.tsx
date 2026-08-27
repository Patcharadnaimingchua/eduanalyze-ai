'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  createCourseInstructor,
  deleteCourseInstructor,
  fetchCourseInstructors,
  fetchInstructorsInScope,
} from '@/lib/api/staff';
import {
  courseInstructorSchema,
  type CourseInstructorFormValues,
} from '@/lib/validation/course-instructor.schema';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';

export function CourseInstructorSection({ courseId }: { courseId: string }) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const instructorsQuery = useQuery({ queryKey: ['instructors-in-scope'], queryFn: fetchInstructorsInScope });
  const assignmentsQuery = useQuery({ queryKey: ['course-instructors'], queryFn: fetchCourseInstructors });

  const instructorMap = new Map((instructorsQuery.data ?? []).map((i) => [i.id, i]));
  const ownAssignments = (assignmentsQuery.data ?? []).filter((a) => a.courseId === courseId);
  const usedIds = new Set(ownAssignments.map((a) => a.userId));
  const options: ComboboxOption[] = (instructorsQuery.data ?? [])
    .filter((i) => !usedIds.has(i.id))
    .map((i) => ({ value: i.id, label: `${i.fullName} (${i.email})`, searchText: `${i.fullName} ${i.email}` }));

  const form = useForm<CourseInstructorFormValues>({
    resolver: zodResolver(courseInstructorSchema),
    defaultValues: { userId: '' },
  });

  async function onSubmit(values: CourseInstructorFormValues) {
    setServerError(null);
    try {
      await createCourseInstructor({ courseId, userId: values.userId });
      form.reset({ userId: '' });
      assignmentsQuery.refetch();
    } catch {
      setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setServerError(null);
    try {
      await deleteCourseInstructor(id);
      setConfirmingId(null);
      assignmentsQuery.refetch();
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

      {ownAssignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">ยังไม่มีอาจารย์ผู้สอนวิชานี้</p>
      ) : (
        <ul className="space-y-2">
          {ownAssignments.map((assignment) => {
            const instructor = instructorMap.get(assignment.userId);
            return (
              <li
                key={assignment.id}
                className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
              >
                <span>{instructor ? `${instructor.fullName} (${instructor.email})` : assignment.userId}</span>
                {confirmingId === assignment.id ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={busyId === assignment.id}
                      onClick={() => handleDelete(assignment.id)}
                    >
                      ยืนยัน
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setConfirmingId(null)}>
                      ยกเลิก
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingId(assignment.id)}>
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
            name="userId"
            render={({ field }) => (
              <FormItem className="w-72">
                <FormControl>
                  <Combobox
                    options={options}
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    placeholder="เลือกอาจารย์ผู้สอน"
                    searchPlaceholder="ค้นหาชื่อหรืออีเมล..."
                    emptyText="ไม่พบอาจารย์ที่ตรงกับคำค้นหา"
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
