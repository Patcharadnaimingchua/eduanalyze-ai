'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import type { CourseListItem } from '@eduanalyze-ai/shared-types';
import { createCourseRecord } from '@/lib/api/academic-record';
import {
  courseRecordSchema,
  type CourseRecordFormValues,
} from '@/lib/validation/course-record.schema';
import { GRADE_LABELS, GRADE_OPTIONS } from '@/lib/grade-label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SemesterOption {
  id: string;
  label: string;
}

export function AddRecordForm({
  studentProfileId,
  courses,
  semesterOptions,
  onCreated,
}: {
  studentProfileId: string;
  courses: CourseListItem[];
  semesterOptions: SemesterOption[];
  onCreated: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  // Bumped on every successful submit to force the <Select>s to fully
  // remount (see key={formKey} below) — form.reset() alone correctly
  // clears react-hook-form's underlying values, but Radix's Select keeps
  // its own internal display state and doesn't reliably re-render back to
  // the placeholder just because its controlled `value` prop changed.
  const [formKey, setFormKey] = useState(0);
  const form = useForm<CourseRecordFormValues>({
    resolver: zodResolver(courseRecordSchema),
    defaultValues: { courseId: '', semesterId: '', grade: undefined },
  });

  async function onSubmit(values: CourseRecordFormValues) {
    setServerError(null);
    try {
      await createCourseRecord({ studentProfileId, ...values });
      form.reset({ courseId: '', semesterId: '', grade: undefined });
      setFormKey((key) => key + 1);
      onCreated();
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setServerError('มีการบันทึกวิชานี้ในภาคเรียนนี้ไว้แล้ว');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">เพิ่มรายวิชา</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form key={formKey} onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="semesterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ภาคเรียน</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกภาคเรียน" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {semesterOptions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>วิชา</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกวิชา" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {`${c.code} — ${c.name} (${c.credits} หน่วยกิต)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เกรด</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกเกรด" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GRADE_OPTIONS.map((g) => (
                          <SelectItem key={g} value={g}>
                            {GRADE_LABELS[g]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'กำลังบันทึก...' : 'เพิ่มรายวิชา'}
            </Button>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
