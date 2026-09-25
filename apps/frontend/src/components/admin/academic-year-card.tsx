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
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/toast-context';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TERM_ORDER: Record<Semester['term'], number> = { FIRST: 0, SECOND: 1, SUMMER: 2 };

export function AcademicYearCard({
  academicYear,
  semesters,
  onChanged,
}: {
  academicYear: AcademicYear;
  semesters: Semester[];
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
      toast.success('ลบปีการศึกษาแล้ว');
      onChanged();
    } catch (error) {
      setConfirmingYearDelete(false);
      if (isAxiosError(error) && error.response?.status === 409) {
        setServerError('ลบไม่ได้ เพราะยังมีภาคเรียนที่ใช้งานอยู่ในปีการศึกษานี้');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteSemester(id: string) {
    setBusyId(id);
    setServerError(null);
    try {
      await deleteSemester(id);
      toast.success('ลบภาคเรียนแล้ว');
      onChanged();
    } catch (error) {
      setConfirmingSemesterId(null);
      if (isAxiosError(error) && error.response?.status === 409) {
        setServerError('ลบไม่ได้ เพราะยังมีการบันทึกผลการเรียนอ้างอิงภาคเรียนนี้อยู่');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setBusyId(null);
    }
  }

  async function onSubmitSemester(values: SemesterFormValues) {
    setServerError(null);
    try {
      await createSemester({ ...values, academicYearId: academicYear.id });
      toast.success('เพิ่มภาคเรียนแล้ว');
      form.reset({ term: undefined });
      onChanged();
    } catch {
      setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
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
      if (isAxiosError(error) && error.response?.status === 409) {
        setServerError('มีปีการศึกษานี้อยู่ในระบบแล้ว');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
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
      if (isAxiosError(error) && error.response?.status === 409) {
        setServerError('ภาคเรียนนี้มีอยู่ในปีการศึกษานี้แล้ว');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
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
              <Button type="submit" size="sm" disabled={yearEditForm.formState.isSubmitting}>
                บันทึก
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingYear(false)}>
                ยกเลิก
              </Button>
            </form>
          </Form>
        ) : (
          <CardTitle>ปีการศึกษา {academicYear.year}</CardTitle>
        )}
        {confirmingYearDelete ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={busyId === academicYear.id}
              onClick={handleDeleteYear}
            >
              ยืนยันลบ
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmingYearDelete(false)}
            >
              ยกเลิก
            </Button>
          </div>
        ) : (
          !editingYear && (
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={startEditingYear}>
                แก้ไข
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingYearDelete(true)}
              >
                ลบปีการศึกษา
              </Button>
            </div>
          )
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
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
                          size="sm"
                          disabled={semesterEditForm.formState.isSubmitting}
                        >
                          บันทึก
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingSemesterId(null)}
                        >
                          ยกเลิก
                        </Button>
                      </form>
                    </Form>
                  ) : (
                    <>
                      <span>{SEMESTER_TERM_LABELS[semester.term]}</span>
                      {confirmingSemesterId === semester.id ? (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={busyId === semester.id}
                            onClick={() => handleDeleteSemester(semester.id)}
                          >
                            ยืนยัน
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmingSemesterId(null)}
                          >
                            ยกเลิก
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingSemester(semester)}
                          >
                            แก้ไข
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmingSemesterId(semester.id)}
                          >
                            ลบ
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
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
              <Button type="submit" variant="outline" size="sm" disabled={form.formState.isSubmitting}>
                เพิ่มภาคเรียน
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
