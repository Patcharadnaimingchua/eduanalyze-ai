'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { createAcademicYear } from '@/lib/api/admin';
import {
  academicYearSchema,
  type AcademicYearFormValues,
} from '@/lib/validation/academic-year.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export function AcademicYearForm({ onCreated }: { onCreated: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: { year: undefined },
  });

  async function onSubmit(values: AcademicYearFormValues) {
    setServerError(null);
    try {
      await createAcademicYear(values);
      form.reset({ year: undefined });
      onCreated();
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setServerError('มีปีการศึกษานี้อยู่ในระบบแล้ว');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">เพิ่มปีการศึกษา</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-end gap-3">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem className="w-40">
                    <FormLabel>ปีการศึกษา (พ.ศ.)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2569" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'กำลังบันทึก...' : 'เพิ่ม'}
              </Button>
            </div>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
