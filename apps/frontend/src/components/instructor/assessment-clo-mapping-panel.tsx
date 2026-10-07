'use client';

import { useId, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type { CloAchievementEntry } from '@eduanalyze-ai/shared-types';
import {
  createAssessmentCloMapping,
  fetchAssessmentCloMappings,
} from '@/lib/api/assessment-evidence';
import {
  assessmentCloMappingSchema,
  type AssessmentCloMappingFormValues,
} from '@/lib/validation/assessment-clo-mapping.schema';
import { useToast } from '@/lib/toast-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { ListSkeleton } from '@/components/ui/skeleton';

export function AssessmentCloMappingPanel({
  courseId,
  clos,
  assessmentDefinitionId,
  selectedMappingId,
  onSelect,
}: {
  courseId: string;
  // Scoped to this course already (course.clos from GET /dashboard/instructor)
  // — never fetched from GET /clos, which INSTRUCTOR is not authorized to
  // call (that endpoint returns the unscoped system-wide catalog; see
  // clo.controller.ts and PROJECT_CONTEXT.md §9).
  clos: CloAchievementEntry[];
  assessmentDefinitionId: string;
  selectedMappingId: string | null;
  onSelect: (mappingId: string, cloId: string) => void;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [formOpenOverride, setFormOpenOverride] = useState<boolean | null>(null);
  const formId = useId();

  const mappingsQuery = useQuery({
    queryKey: ['assessment-clo-mappings', assessmentDefinitionId],
    queryFn: () => fetchAssessmentCloMappings(assessmentDefinitionId, courseId),
  });

  const cloById = useMemo(() => new Map(clos.map((c) => [c.cloId, c])), [clos]);
  const cloOptions: ComboboxOption[] = clos.map((c) => ({
    value: c.cloId,
    label: `${c.code} — ${c.description}`,
    searchText: `${c.code} ${c.description}`,
  }));

  const form = useForm<AssessmentCloMappingFormValues>({
    resolver: zodResolver(assessmentCloMappingSchema),
    defaultValues: { cloId: '', weight: 1, maxScoreOverride: undefined },
  });

  async function onSubmit(values: AssessmentCloMappingFormValues) {
    setServerError(null);
    try {
      const created = await createAssessmentCloMapping({ ...values, assessmentDefinitionId, courseId });
      form.reset({ cloId: '', weight: 1, maxScoreOverride: undefined });
      await queryClient.invalidateQueries({
        queryKey: ['assessment-clo-mappings', assessmentDefinitionId],
      });
      setFormOpenOverride(false);
      onSelect(created.id, created.cloId);
      toast.success('เชื่อมกับเป้าการเรียนรู้แล้ว');
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setServerError('การประเมินนี้เชื่อมกับเป้าการเรียนรู้ข้อนี้ไว้แล้ว');
      } else if (isAxiosError(error) && error.response?.status === 400) {
        setServerError('ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    }
  }

  const mappings = mappingsQuery.data ?? [];
  const formOpen = formOpenOverride ?? (!!mappingsQuery.data && mappings.length === 0);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
          {mappingsQuery.isLoading && <ListSkeleton items={3} />}
          {mappingsQuery.isError && <p className="text-sm text-destructive">ไม่สามารถโหลดข้อมูลได้</p>}
          {mappingsQuery.data && mappings.length === 0 && (
            <p className="text-sm text-muted-foreground">ยังไม่ได้เชื่อมกับเป้าการเรียนรู้ข้อใดเลย ต้องเชื่อมอย่างน้อย 1 ข้อก่อนจึงกรอกคะแนนได้ (ระบบเก็บคะแนนไว้ใต้เป้านั้น) — เลือกด้านล่าง</p>
          )}
          {mappings.map((mapping) => {
            const clo = cloById.get(mapping.cloId);
            return (
              <button
                key={mapping.id}
                type="button"
                onClick={() => onSelect(mapping.id, mapping.cloId)}
                className={cn(
                  'flex min-h-11 w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition',
                  selectedMappingId === mapping.id
                    ? 'border-brand bg-brand/5 text-brand'
                    : 'border-slate-100 text-primary hover:border-slate-200',
                )}
              >
                <span>
                  <span className="font-medium">{clo?.code ?? mapping.cloId}</span>{' '}
                  <span className="text-muted-foreground">
                    (สัดส่วนคะแนน {mapping.weight}
                    {mapping.maxScoreOverride ? `, เต็ม ${mapping.maxScoreOverride}` : ''})
                  </span>
                </span>
              </button>
            );
          })}
      </div>

      <div className="rounded-lg border">
        <div className="flex items-center justify-between gap-3 px-4 py-1">
          <h3 className="text-sm font-medium text-primary">เชื่อมกับเป้าการเรียนรู้เพิ่ม</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFormOpenOverride(!formOpen)}
            aria-expanded={formOpen}
            aria-controls={formId}
            className="min-h-11 gap-1.5"
          >
            {formOpen ? 'ซ่อนฟอร์ม' : 'แสดงฟอร์ม'}
            <ChevronDown size={14} className={cn('transition-transform', formOpen && 'rotate-180')} />
          </Button>
        </div>
        <div id={formId} hidden={!formOpen}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 px-4 pb-4 pt-0">
              {serverError && (
                <Alert variant="destructive">
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name="cloId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เป้าการเรียนรู้</FormLabel>
                      <FormControl>
                        <div className="[&_button]:h-11">
                        <Combobox
                          options={cloOptions}
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                          placeholder="เลือกเป้าการเรียนรู้"
                          searchPlaceholder="ค้นหารหัสหรือคำอธิบายเป้าการเรียนรู้..."
                          emptyText="ไม่พบเป้าการเรียนรู้ที่ตรงกับคำค้นหา"
                        />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>สัดส่วนคะแนน</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" inputMode="decimal" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxScoreOverride"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>คะแนนเต็มเฉพาะเป้านี้ (ถ้ามี)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          className="h-11"
                          placeholder="ค่าเริ่มต้น = คะแนนเต็มของการประเมิน"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="h-11" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'กำลังบันทึก...' : 'เชื่อมกับเป้านี้'}
              </Button>
            </CardContent>
          </form>
        </Form>
        </div>
      </div>
    </div>
  );
}
