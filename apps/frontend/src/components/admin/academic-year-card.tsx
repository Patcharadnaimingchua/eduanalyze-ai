'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import type { AcademicYear, Semester } from '@eduanalyze-ai/shared-types';
import { createSemester, deleteAcademicYear, deleteSemester } from '@/lib/api/admin';
import { semesterSchema, type SemesterFormValues } from '@/lib/validation/semester.schema';
import { SEMESTER_TERM_LABELS } from '@/lib/grade-label';
import { Button } from '@/components/ui/button';
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
  const [confirmingSemesterId, setConfirmingSemesterId] = useState<string | null>(null);
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

  async function handleDeleteYear() {
    setBusyId(academicYear.id);
    setServerError(null);
    try {
      await deleteAcademicYear(academicYear.id);
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
      form.reset({ term: undefined });
      onChanged();
    } catch {
      setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">ปีการศึกษา {academicYear.year}</CardTitle>
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
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingYearDelete(true)}>
            ลบปีการศึกษา
          </Button>
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
            {sortedSemesters.map((semester) => (
              <li
                key={semester.id}
                className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
              >
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmingSemesterId(semester.id)}
                  >
                    ลบ
                  </Button>
                )}
              </li>
            ))}
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
