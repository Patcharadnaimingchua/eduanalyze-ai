'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { createCourseCategory } from '@/lib/api/staff';
import {
  courseCategorySchema,
  type CourseCategoryFormValues,
} from '@/lib/validation/course-category.schema';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/toast-context';
import { Input } from '@/components/ui/input';
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
import { describeStaffWriteError } from '@/lib/describe-staff-write-error';

export function CourseCategoryForm({
  curriculumId,
  onCreated,
  onCancel,
}: {
  curriculumId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const toast = useToast();
  const form = useForm<CourseCategoryFormValues>({
    resolver: zodResolver(courseCategorySchema),
    defaultValues: { name: '', code: '' },
  });

  async function onSubmit(values: CourseCategoryFormValues) {
    setServerError(null);
    // Flow that writes: POST /course-categories
    try {
      await createCourseCategory({
        curriculumId,
        name: values.name,
        code: values.code || undefined,
      });
      toast.success('เพิ่มหมวดวิชาแล้ว');
      form.reset({ name: '', code: '' });
      onCreated();
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setServerError('มีหมวดวิชาชื่อนี้อยู่ในหลักสูตรนี้แล้ว');
      } else {
        setServerError(describeStaffWriteError(error));
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>เพิ่มหมวดวิชา</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อหมวดวิชา</FormLabel>
                    <FormControl>
                      <Input className="h-11" placeholder="หมวดวิชาศึกษาทั่วไป" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รหัสหมวดวิชา (ถ้ามี)</FormLabel>
                    <FormControl>
                      <Input className="h-11" placeholder="GENED" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" className="h-11 px-5" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'กำลังบันทึก...' : 'เพิ่มหมวดวิชา'}
              </Button>
              <Button type="button" variant="outline" className="h-11 px-5" onClick={onCancel}>
                ยกเลิก
              </Button>
            </div>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
