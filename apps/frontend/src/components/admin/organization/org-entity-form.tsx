'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orgEntitySchema, type OrgEntityFormValues } from '@/lib/validation/organization.schema';
import { describeOrgWriteError } from './org-errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export function OrgEntityForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  defaultValues?: OrgEntityFormValues;
  submitLabel: string;
  onSubmit: (values: OrgEntityFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<OrgEntityFormValues>({
    resolver: zodResolver(orgEntitySchema),
    defaultValues: defaultValues ?? { name: '', code: '' },
  });

  async function handleSubmit(values: OrgEntityFormValues) {
    setServerError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(describeOrgWriteError(error, 'รหัสหรือชื่อนี้ถูกใช้แล้วในระดับเดียวกัน'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-wrap items-start gap-3">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="w-32">
                <FormLabel>รหัส</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="min-w-[16rem] flex-1">
                <FormLabel>ชื่อ</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'กำลังบันทึก...' : submitLabel}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            ยกเลิก
          </Button>
        </div>
      </form>
    </Form>
  );
}
