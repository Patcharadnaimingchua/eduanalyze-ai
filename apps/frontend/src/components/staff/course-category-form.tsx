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
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export function CourseCategoryForm({
  curriculumId,
  onCreated,
}: {
  curriculumId: string;
  onCreated: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<CourseCategoryFormValues>({
    resolver: zodResolver(courseCategorySchema),
    defaultValues: { name: '', code: '' },
  });

  async function onSubmit(values: CourseCategoryFormValues) {
    setServerError(null);
    try {
      await createCourseCategory({
        curriculumId,
        name: values.name,
        code: values.code || undefined,
      });
      form.reset({ name: '', code: '' });
      onCreated();
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setServerError('มีหมวดวิชาชื่อนี้อยู่ในหลักสูตรนี้แล้ว');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">เพิ่มหมวดวิชา</CardTitle>
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
                      <Input placeholder="หมวดวิชาศึกษาทั่วไป" {...field} />
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
                      <Input placeholder="GENED" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'กำลังบันทึก...' : 'เพิ่มหมวดวิชา'}
            </Button>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
