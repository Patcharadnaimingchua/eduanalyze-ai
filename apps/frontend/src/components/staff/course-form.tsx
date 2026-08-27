'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { createCourse } from '@/lib/api/staff';
import { courseSchema, type CourseFormValues } from '@/lib/validation/course.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export function CourseForm({
  curriculumId,
  categoryId,
  onCreated,
}: {
  curriculumId: string;
  categoryId: string;
  onCreated: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: { code: '', name: '', nameEn: '', credits: undefined, description: '', isRequired: true },
  });

  async function onSubmit(values: CourseFormValues) {
    setServerError(null);
    try {
      await createCourse({
        curriculumId,
        categoryId,
        code: values.code,
        name: values.name,
        nameEn: values.nameEn || undefined,
        credits: values.credits,
        description: values.description || undefined,
        isRequired: values.isRequired,
      });
      form.reset({ code: '', name: '', nameEn: '', credits: undefined, description: '', isRequired: true });
      onCreated();
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setServerError('มีรหัสวิชานี้อยู่ในหลักสูตรนี้แล้ว');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">เพิ่มวิชา</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รหัสวิชา</FormLabel>
                    <FormControl>
                      <Input placeholder="CS101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อวิชา</FormLabel>
                    <FormControl>
                      <Input placeholder="หลักการเขียนโปรแกรม" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="credits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>หน่วยกิต</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อวิชา (อังกฤษ)</FormLabel>
                    <FormControl>
                      <Input placeholder="Principles of Programming" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'กำลังบันทึก...' : 'เพิ่มวิชา'}
            </Button>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
