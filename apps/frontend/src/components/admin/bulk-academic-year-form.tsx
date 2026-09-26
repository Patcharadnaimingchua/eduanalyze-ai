'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  bulkGenerateAcademicYears,
  type ResultRow,
  type ResultStatus,
} from '@/lib/bulk-academic-year';
import {
  bulkAcademicYearSchema,
  type BulkAcademicYearFormValues,
} from '@/lib/validation/academic-year.schema';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/toast-context';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { SemanticTone } from '@/lib/tone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const YEARS_TO_CREATE = 4;

const STATUS_LABEL: Record<ResultStatus, string> = {
  created: 'สร้างใหม่',
  skipped: 'มีอยู่แล้ว',
  failed: 'ผิดพลาด',
};

const STATUS_TONE: Record<ResultStatus, SemanticTone> = {
  created: 'success',
  skipped: 'neutral',
  failed: 'danger',
};

export function BulkAcademicYearForm({ onCreated }: { onCreated: () => void }) {
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const toast = useToast();
  const form = useForm<BulkAcademicYearFormValues>({
    resolver: zodResolver(bulkAcademicYearSchema),
    defaultValues: { startYear: undefined },
  });

  async function onSubmit(values: BulkAcademicYearFormValues) {
    setResults(null);
    try {
      const rows = await bulkGenerateAcademicYears(values.startYear, YEARS_TO_CREATE);
      setResults(rows);
      const created = rows.filter((r) => r.status === 'created').length;
      const failed = rows.filter((r) => r.status === 'failed').length;
      if (failed > 0) toast.error(`สร้างไม่สำเร็จ ${failed} รายการ — ดูรายละเอียดในตาราง`);
      else toast.success(`สร้างปีการศึกษาแล้ว ${created} รายการ`);
      onCreated();
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  }

  const createdCount = results?.filter((r) => r.status === 'created').length ?? 0;
  const skippedCount = results?.filter((r) => r.status === 'skipped').length ?? 0;
  const failedCount = results?.filter((r) => r.status === 'failed').length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>สร้างชุดปีการศึกษาอัตโนมัติ</CardTitle>
        <p className="text-sm text-muted-foreground">
          กรอกปีเริ่มต้น ระบบจะสร้างปีการศึกษา {YEARS_TO_CREATE} ปีต่อเนื่องกัน
          พร้อมภาคเรียนต้น/ปลาย/ฤดูร้อนให้ครบทุกปีโดยอัตโนมัติ
          ปี/ภาคเรียนที่มีอยู่แล้วจะถูกข้ามไป ไม่ error ทั้งชุด
        </p>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-3">
              <FormField
                control={form.control}
                name="startYear"
                render={({ field }) => (
                  <FormItem className="w-40">
                    <FormLabel>ปีเริ่มต้น (พ.ศ.)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2566" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'กำลังสร้าง...'
                  : `สร้างชุด ${YEARS_TO_CREATE} ปี`}
              </Button>
            </div>

            {results && (
              <div className="space-y-2 rounded-md border border-slate-200 p-3">
                <p className="text-sm font-medium text-primary">
                  สร้างใหม่ {createdCount} รายการ · มีอยู่แล้ว {skippedCount} รายการ
                  {failedCount > 0 && ` · ผิดพลาด ${failedCount} รายการ`}
                </p>
                <ul className="space-y-1 text-sm">
                  {results.map((r) => (
                    <li key={r.label} className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">{r.label}</span>
                      <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
