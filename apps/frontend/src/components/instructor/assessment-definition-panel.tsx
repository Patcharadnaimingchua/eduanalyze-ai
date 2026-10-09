'use client';

import { useId, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  createAssessmentDefinition,
  fetchAssessmentDefinitions,
} from '@/lib/api/assessment-evidence';
import { fetchAcademicYears, fetchSemesters } from '@/lib/api/academic-record';
import {
  assessmentDefinitionSchema,
  type AssessmentDefinitionFormValues,
} from '@/lib/validation/assessment-definition.schema';
import { formatSemesterLabel } from '@/lib/grade-label';
import { useToast } from '@/lib/toast-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ListSkeleton } from '@/components/ui/skeleton';

const TERM_ORDER: Record<string, number> = { FIRST: 0, SECOND: 1, SUMMER: 2 };

export function AssessmentDefinitionPanel({
  courseId,
  selectedDefinitionId,
  onSelect,
}: {
  courseId: string;
  selectedDefinitionId: string | null;
  onSelect: (definitionId: string) => void;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  // null = follow the default (open only while the list is empty); the
  // user's own toggle wins after that.
  const [formOpenOverride, setFormOpenOverride] = useState<boolean | null>(null);

  const definitionsQuery = useQuery({
    queryKey: ['assessment-definitions', courseId],
    queryFn: () => fetchAssessmentDefinitions(courseId),
  });
  const semestersQuery = useQuery({ queryKey: ['semesters'], queryFn: fetchSemesters });
  const academicYearsQuery = useQuery({
    queryKey: ['academic-years'],
    queryFn: fetchAcademicYears,
  });

  const yearById = useMemo(
    () => new Map((academicYearsQuery.data ?? []).map((y) => [y.id, y.year])),
    [academicYearsQuery.data],
  );
  const semesterOptions = useMemo(() => {
    return (semestersQuery.data ?? [])
      .map((s) => ({
        id: s.id,
        year: yearById.get(s.academicYearId),
        term: s.term,
        label: formatSemesterLabel(s.term, yearById.get(s.academicYearId)),
      }))
      .sort((a, b) => {
        const yearDiff = (b.year ?? 0) - (a.year ?? 0);
        if (yearDiff !== 0) return yearDiff;
        return TERM_ORDER[b.term] - TERM_ORDER[a.term];
      });
  }, [semestersQuery.data, yearById]);

  const form = useForm<AssessmentDefinitionFormValues>({
    resolver: zodResolver(assessmentDefinitionSchema),
    defaultValues: { title: '', kind: '', maxScore: 100, semesterId: '' },
  });

  async function onSubmit(values: AssessmentDefinitionFormValues) {
    setServerError(null);
    try {
      const created = await createAssessmentDefinition({ ...values, courseId });
      form.reset({ title: '', kind: '', maxScore: 100, semesterId: '' });
      await queryClient.invalidateQueries({ queryKey: ['assessment-definitions', courseId] });
      setFormOpenOverride(false);
      onSelect(created.id);
      toast.success('เพิ่มการประเมินแล้ว');
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 400) {
        setServerError('ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    }
  }

  const definitions = definitionsQuery.data ?? [];
  const formOpen = formOpenOverride ?? (!!definitionsQuery.data && definitions.length === 0);
  const formId = useId();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {definitionsQuery.isLoading && <ListSkeleton items={3} />}
        {definitionsQuery.isError && (
          <p className="text-sm text-destructive">ไม่สามารถโหลดข้อมูลได้</p>
        )}
        {definitionsQuery.data && definitions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            ยังไม่มีการประเมินในรายวิชานี้ — เพิ่มด้านล่าง
          </p>
        )}
        {definitions.map((def) => (
          <button
            key={def.id}
            type="button"
            onClick={() => onSelect(def.id)}
            className={cn(
              'flex min-h-11 w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition',
              selectedDefinitionId === def.id
                ? 'border-brand bg-brand/5 text-brand'
                : 'border-slate-100 text-primary hover:border-slate-200',
            )}
          >
            <span>
              <span className="font-medium">{def.title}</span>{' '}
              <span className="text-muted-foreground">
                ({def.kind}, เต็ม {def.maxScore})
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-lg border">
        <div className="flex items-center justify-between gap-3 px-4 py-1">
          <h3 className="text-sm font-medium text-primary">เพิ่มข้อสอบ ควิซ หรืองานใหม่</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFormOpenOverride(!formOpen)}
            aria-expanded={formOpen}
            aria-controls={formId}
            className="gap-1.5"
          >
            {formOpen ? 'ซ่อนฟอร์ม' : 'แสดงฟอร์ม'}
            <ChevronDown
              size={14}
              className={cn('transition-transform', formOpen && 'rotate-180')}
            />
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

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ชื่อการประเมิน</FormLabel>
                        <FormControl>
                          <Input placeholder="เช่น สอบกลางภาค" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="kind"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ประเภท (พิมพ์เอง)</FormLabel>
                        <FormControl>
                          <Input placeholder="เช่น ข้อสอบ ควิซ งาน" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>คะแนนเต็ม</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" inputMode="decimal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                </div>

                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'กำลังบันทึก...' : 'เพิ่มการประเมิน'}
                </Button>
              </CardContent>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
