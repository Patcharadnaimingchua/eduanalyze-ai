'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  createAssessmentCloMapping,
  fetchAssessmentCloMappings,
} from '@/lib/api/assessment-evidence';
import { fetchClos } from '@/lib/api/course-assessment';
import {
  assessmentCloMappingSchema,
  type AssessmentCloMappingFormValues,
} from '@/lib/validation/assessment-clo-mapping.schema';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';

export function AssessmentCloMappingPanel({
  courseId,
  assessmentDefinitionId,
  selectedMappingId,
  onSelect,
}: {
  courseId: string;
  assessmentDefinitionId: string;
  selectedMappingId: string | null;
  onSelect: (mappingId: string, cloId: string) => void;
}) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const mappingsQuery = useQuery({
    queryKey: ['assessment-clo-mappings', assessmentDefinitionId],
    queryFn: () => fetchAssessmentCloMappings(assessmentDefinitionId, courseId),
  });
  const closQuery = useQuery({ queryKey: ['clos'], queryFn: fetchClos });

  const clos = useMemo(
    () => (closQuery.data ?? []).filter((c) => c.courseId === courseId),
    [closQuery.data, courseId],
  );
  const cloById = useMemo(() => new Map(clos.map((c) => [c.id, c])), [clos]);
  const cloOptions: ComboboxOption[] = clos.map((c) => ({
    value: c.id,
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
      onSelect(created.id, created.cloId);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setServerError('การประเมินนี้ผูกกับ CLO นี้ไว้แล้ว');
      } else if (isAxiosError(error) && error.response?.status === 400) {
        setServerError('ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    }
  }

  const mappings = mappingsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CLO ที่ผูกกับการประเมินนี้</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {mappingsQuery.isLoading && <p className="text-sm text-muted-foreground">กำลังโหลด...</p>}
          {mappingsQuery.isError && <p className="text-sm text-destructive">ไม่สามารถโหลดข้อมูลได้</p>}
          {mappingsQuery.data && mappings.length === 0 && (
            <p className="text-sm text-muted-foreground">ยังไม่มี CLO ผูกกับการประเมินนี้ — เพิ่มด้านล่าง</p>
          )}
          {mappings.map((mapping) => {
            const clo = cloById.get(mapping.cloId);
            return (
              <button
                key={mapping.id}
                type="button"
                onClick={() => onSelect(mapping.id, mapping.cloId)}
                className={cn(
                  'flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition',
                  selectedMappingId === mapping.id
                    ? 'border-brand bg-brand/5 text-brand'
                    : 'border-slate-100 text-primary hover:border-slate-200',
                )}
              >
                <span>
                  <span className="font-medium">{clo?.code ?? mapping.cloId}</span>{' '}
                  <span className="text-muted-foreground">
                    (น้ำหนัก {mapping.weight}
                    {mapping.maxScoreOverride ? `, เต็ม ${mapping.maxScoreOverride}` : ''})
                  </span>
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ผูก CLO เพิ่ม</CardTitle>
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
                  name="cloId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CLO</FormLabel>
                      <FormControl>
                        <Combobox
                          options={cloOptions}
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                          placeholder="เลือก CLO"
                          searchPlaceholder="ค้นหารหัสหรือคำอธิบาย CLO..."
                          emptyText="ไม่พบ CLO ที่ตรงกับคำค้นหา"
                        />
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
                      <FormLabel>น้ำหนักคะแนน</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
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
                      <FormLabel>คะแนนเต็ม (เฉพาะ CLO นี้ ถ้ามี)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
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

              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'กำลังบันทึก...' : 'ผูก CLO'}
              </Button>
            </CardContent>
          </form>
        </Form>
      </Card>
    </div>
  );
}
