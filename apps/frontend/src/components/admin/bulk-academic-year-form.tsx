'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import type { SemesterTerm } from '@eduanalyze-ai/shared-types';
import { createAcademicYear, createSemester } from '@/lib/api/admin';
import { fetchAcademicYears } from '@/lib/api/academic-record';
import {
  bulkAcademicYearSchema,
  type BulkAcademicYearFormValues,
} from '@/lib/validation/academic-year.schema';
import { SEMESTER_TERM_LABELS } from '@/lib/grade-label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const TERMS: SemesterTerm[] = ['FIRST', 'SECOND', 'SUMMER'];
const YEARS_TO_CREATE = 4;

type ResultStatus = 'created' | 'skipped' | 'failed';
type ResultRow = { label: string; status: ResultStatus };

const STATUS_LABEL: Record<ResultStatus, string> = {
  created: 'สร้างใหม่',
  skipped: 'มีอยู่แล้ว',
  failed: 'ผิดพลาด',
};

const STATUS_TONE: Record<ResultStatus, BadgeTone> = {
  created: 'green',
  skipped: 'gray',
  failed: 'red',
};

// Attempts a create and always resolves to a ResultRow instead of throwing —
// a 409 means "already exists" (not an error to report), so the whole batch
// never aborts on a duplicate. See academic-year-form.tsx for the same
// 409-as-friendly-message convention on the single-create path.
async function attemptCreate<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<{ row: ResultRow; value: T | null }> {
  try {
    const value = await fn();
    return { row: { label, status: 'created' }, value };
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 409) {
      return { row: { label, status: 'skipped' }, value: null };
    }
    return { row: { label, status: 'failed' }, value: null };
  }
}

export function BulkAcademicYearForm({ onCreated }: { onCreated: () => void }) {
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const form = useForm<BulkAcademicYearFormValues>({
    resolver: zodResolver(bulkAcademicYearSchema),
    defaultValues: { startYear: undefined },
  });

  async function onSubmit(values: BulkAcademicYearFormValues) {
    setResults(null);
    const targetYears = Array.from(
      { length: YEARS_TO_CREATE },
      (_, i) => values.startYear + i,
    );

    const rows: ResultRow[] = [];
    const yearIds = new Map<number, string>();

    for (const year of targetYears) {
      const { row, value } = await attemptCreate(`ปีการศึกษา ${year}`, () =>
        createAcademicYear({ year }),
      );
      rows.push(row);
      if (value) {
        yearIds.set(year, value.id);
      }
    }

    // Years skipped as duplicates have no id from the failed POST — resolve
    // them with a single fresh GET rather than trusting stale query-cache
    // props, so semester creation below still has an academicYearId to use.
    if (yearIds.size < targetYears.length) {
      const allYears = await fetchAcademicYears();
      for (const year of targetYears) {
        if (!yearIds.has(year)) {
          const existing = allYears.find((y) => y.year === year);
          if (existing) yearIds.set(year, existing.id);
        }
      }
    }

    for (const year of targetYears) {
      const academicYearId = yearIds.get(year);
      if (!academicYearId) continue; // creation failed and no existing row to resolve — skip its semesters

      for (const term of TERMS) {
        const { row } = await attemptCreate(
          `${year} ${SEMESTER_TERM_LABELS[term]}`,
          () => createSemester({ term, academicYearId }),
        );
        rows.push(row);
      }
    }

    setResults(rows);
    onCreated();
  }

  const createdCount = results?.filter((r) => r.status === 'created').length ?? 0;
  const skippedCount = results?.filter((r) => r.status === 'skipped').length ?? 0;
  const failedCount = results?.filter((r) => r.status === 'failed').length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">สร้างชุดปีการศึกษาอัตโนมัติ</CardTitle>
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
                  {results.map((r, i) => (
                    <li key={i} className="flex items-center justify-between gap-2">
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
