'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import type { AcademicYear, Semester } from '@eduanalyze-ai/shared-types';
import {
  createSemester,
  deleteAcademicYear,
  deleteSemester,
  updateAcademicYear,
  updateSemester,
} from '@/lib/api/admin';
import {
  academicYearSchema,
  type AcademicYearFormValues,
} from '@/lib/validation/academic-year.schema';
import { semesterSchema, type SemesterFormValues } from '@/lib/validation/semester.schema';
import { SEMESTER_TERM_LABELS } from '@/lib/grade-label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/toast-context';
import { Input } from '@/components/ui/input';
import { describeApiError } from '@/lib/describe-api-error';
import { ApiErrorAlert } from '@/components/admin/api-error-alert';
import { DeactivateConfirm } from '@/components/admin/deactivate-confirm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TERM_ORDER: Record<Semester['term'], number> = { FIRST: 0, SECOND: 1, SUMMER: 2 };

export function AcademicYearCard({
  academicYear,
  semesters,
  isCurrent = false,
  onChanged,
}: {
  academicYear: AcademicYear;
  semesters: Semester[];
  isCurrent?: boolean;
  onChanged: () => void;
}) {
  const [confirmingYearDelete, setConfirmingYearDelete] = useState(false);
  const toast = useToast();
  const [confirmingSemesterId, setConfirmingSemesterId] = useState<string | null>(null);
  const [editingYear, setEditingYear] = useState(false);
  const [editingSemesterId, setEditingSemesterId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const sortedSemesters = [...semesters].sort((a, b) => TERM_ORDER[a.term] - TERM_ORDER[b.term]);
  const confirmingSemester = semesters.find((s) => s.id === confirmingSemesterId);
  const usedTerms = new Set(semesters.map((s) => s.term));
  const availableTerms = (Object.keys(SEMESTER_TERM_LABELS) as Semester['term'][]).filter(
    (term) => !usedTerms.has(term),
  );

  const form = useForm<SemesterFormValues>({
    resolver: zodResolver(semesterSchema),
    defaultValues: { term: undefined },
  });

  const yearEditForm = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: { year: academicYear.year },
  });

  const semesterEditForm = useForm<SemesterFormValues>({
    resolver: zodResolver(semesterSchema),
    defaultValues: { term: undefined },
  });

  async function handleDeleteYear() {
    setBusyId(academicYear.id);
    setServerError(null);
    try {
      await deleteAcademicYear(academicYear.id);
      toast.success('ปิดใช้งานปีการศึกษาแล้ว');
      onChanged();
    } catch (error) {
      setServerError(describeApiError(error, { 409: 'ปิดใช้งานไม่ได้ เพราะยังมีภาคเรียนที่ใช้งานอยู่ในปีการศึกษานี้' }));
    } finally {
      setBusyId(null);
      setConfirmingYearDelete(false);
    }
  }

  async function handleDeleteSemester(id: string) {
    setBusyId(id);
    setServerError(null);
    try {
      await deleteSemester(id);
      toast.success('ปิดใช้งานภาคเรียนแล้ว');
      onChanged();
    } catch (error) {
      setServerError(describeApiError(error, { 409: 'ปิดใช้งานไม่ได้ เพราะยังมีการบันทึกผลการเรียนอ้างอิงภาคเรียนนี้อยู่' }));
    } finally {
      setBusyId(null);
      setConfirmingSemesterId(null);
    }
  }

  async function onSubmitSemester(values: SemesterFormValues) {
    setServerError(null);
    try {
      await createSemester({ ...values, academicYearId: academicYear.id });
      toast.success('เพิ่มภาคเรียนแล้ว');
      form.reset({ term: undefined });
      onChanged();
    } catch (error) {
      setServerError(describeApiError(error));
    }
  }

  // Adds every term the year is missing, one at a time (the server's
  // duplicate check isn't transactional). A 409 means someone else added it
  // meanwhile and is not a failure.
  async function fillMissingSemesters() {
    setBusyId(academicYear.id);
    setServerError(null);
    let failed = 0;
    for (const term of availableTerms) {
      try {
        await createSemester({ term, academicYearId: academicYear.id });
      } catch (error) {
        if (!(isAxiosError(error) && error.response?.status === 409)) failed += 1;
      }
    }
    setBusyId(null);
    if (failed > 0) setServerError(`สร้างภาคเรียนไม่สำเร็จ ${failed} ภาค กรุณาลองใหม่อีกครั้ง`);
    else toast.success('เพิ่มภาคเรียนที่ขาดครบแล้ว');
    onChanged();
  }

  function startEditingYear() {
    yearEditForm.reset({ year: academicYear.year });
    setEditingYear(true);
  }

  async function onSubmitYearEdit(values: AcademicYearFormValues) {
    setServerError(null);
    try {
      await updateAcademicYear(academicYear.id, values);
      toast.success('บันทึกปีการศึกษาแล้ว');
      setEditingYear(false);
      onChanged();
    } catch (error) {
      setServerError(describeApiError(error, { 409: 'มีปีการศึกษานี้อยู่ในระบบแล้ว' }));
    }
  }

  function startEditingSemester(semester: Semester) {
    semesterEditForm.reset({ term: semester.term });
    setEditingSemesterId(semester.id);
  }

  async function onSubmitSemesterEdit(id: string, values: SemesterFormValues) {
    setServerError(null);
    try {
      await updateSemester(id, values);
      toast.success('บันทึกภาคเรียนแล้ว');
      setEditingSemesterId(null);
      onChanged();
    } catch (error) {
      setServerError(describeApiError(error, { 409: 'ภาคเรียนนี้มีอยู่ในปีการศึกษานี้แล้ว' }));
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        {editingYear ? (
          <Form {...yearEditForm}>
            <form
              onSubmit={yearEditForm.handleSubmit(onSubmitYearEdit)}
              className="flex items-end gap-2"
            >
              <FormField
                control={yearEditForm.control}
                name="year"
                render={({ field }) => (
                  <FormItem className="w-32">
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="sm" className="min-h-11" disabled={yearEditForm.formState.isSubmitting}>
                บันทึก
              </Button>
              <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={() => setEditingYear(false)}>
                ยกเลิก
              </Button>
            </form>
          </Form>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>ปีการศึกษา {academicYear.year}</CardTitle>
            {isCurrent && <Badge tone="success">ปีปัจจุบัน</Badge>}
          </div>
        )}
        {!editingYear && (
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" className="min-h-11" onClick={startEditingYear}>
              แก้ไข
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm" className="min-h-11"
              onClick={() => setConfirmingYearDelete(true)}
            >
              ปิดใช้งานปีการศึกษา
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {serverError && (
          <ApiErrorAlert message={serverError} />
        )}

        {sortedSemesters.length === 0 ? (
          <p className="text-sm text-muted-foreground">ยังไม่มีภาคเรียนในปีนี้</p>
        ) : (
          <ul className="space-y-2">
            {sortedSemesters.map((semester) => {
              const editableTerms = [
                semester.term,
                ...availableTerms.filter((term) => term !== semester.term),
              ].sort((a, b) => TERM_ORDER[a] - TERM_ORDER[b]);

              return (
                <li
                  key={semester.id}
                  className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
                >
                  {editingSemesterId === semester.id ? (
                    <Form {...semesterEditForm}>
                      <form
                        onSubmit={semesterEditForm.handleSubmit((values) =>
                          onSubmitSemesterEdit(semester.id, values),
                        )}
                        className="flex w-full items-end gap-2"
                      >
                        <FormField
                          control={semesterEditForm.control}
                          name="term"
                          render={({ field }) => (
                            <FormItem className="w-40">
                              <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {editableTerms.map((term) => (
                                    <SelectItem key={term} value={term}>
                                      {SEMESTER_TERM_LABELS[term]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          size="sm" className="min-h-11"
                          disabled={semesterEditForm.formState.isSubmitting}
                        >
                          บันทึก
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm" className="min-h-11"
                          onClick={() => setEditingSemesterId(null)}
                        >
                          ยกเลิก
                        </Button>
                      </form>
                    </Form>
                  ) : (
                    <>
                      <span>{SEMESTER_TERM_LABELS[semester.term]}</span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm" className="min-h-11"
                          onClick={() => startEditingSemester(semester)}
                        >
                          แก้ไข
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm" className="min-h-11"
                          onClick={() => setConfirmingSemesterId(semester.id)}
                        >
                          ปิดใช้งาน
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {availableTerms.length > 1 && (
          <Button
            type="button"
            variant="outline"
            size="sm" className="min-h-11"
            disabled={busyId === academicYear.id}
            onClick={fillMissingSemesters}
          >
            เพิ่มภาคเรียนที่ขาดทั้งหมด ({availableTerms.length} ภาค)
          </Button>
        )}

        {availableTerms.length > 0 && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmitSemester)}
              className="flex items-end gap-3 border-t border-slate-100 pt-3"
            >
              <FormField
                control={form.control}
                name="term"
                render={({ field }) => (
                  <FormItem className="w-40">
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เพิ่มภาคเรียน" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTerms.map((term) => (
                          <SelectItem key={term} value={term}>
                            {SEMESTER_TERM_LABELS[term]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="outline" size="sm" className="min-h-11" disabled={form.formState.isSubmitting}>
                เพิ่มภาคเรียน
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <DeactivateConfirm
        open={confirmingYearDelete}
        onOpenChange={setConfirmingYearDelete}
        itemLabel={`ปีการศึกษา ${academicYear.year}`}
        busy={busyId === academicYear.id}
        onConfirm={handleDeleteYear}
      />
      <DeactivateConfirm
        open={confirmingSemesterId !== null}
        onOpenChange={(open) => !open && setConfirmingSemesterId(null)}
        itemLabel={`${confirmingSemester ? SEMESTER_TERM_LABELS[confirmingSemester.term] : 'ภาคเรียน'} ปีการศึกษา ${academicYear.year}`}
        busy={busyId !== null && busyId === confirmingSemesterId}
        onConfirm={() => confirmingSemesterId && handleDeleteSemester(confirmingSemesterId)}
      />
    </Card>
  );
}
