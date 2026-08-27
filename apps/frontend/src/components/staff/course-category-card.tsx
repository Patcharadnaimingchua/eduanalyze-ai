'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import type { CourseCategory, CurriculumRequirement } from '@eduanalyze-ai/shared-types';
import {
  createCurriculumRequirement,
  deleteCourseCategory,
  deleteCurriculumRequirement,
  updateCurriculumRequirement,
} from '@/lib/api/staff';
import {
  curriculumRequirementSchema,
  type CurriculumRequirementFormValues,
} from '@/lib/validation/curriculum-requirement.schema';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// CurriculumRequirement is an optional 1:1 with CourseCategory (unlike
// AcademicYearCard's Semester, which is a 1:many list) — the only
// structural difference from that reference component otherwise.
export function CourseCategoryCard({
  category,
  requirement,
  isSelected,
  onSelect,
  onChanged,
}: {
  category: CourseCategory;
  requirement: CurriculumRequirement | undefined;
  isSelected: boolean;
  onSelect: () => void;
  onChanged: () => void;
}) {
  const [confirmingCategoryDelete, setConfirmingCategoryDelete] = useState(false);
  const [confirmingRequirementDelete, setConfirmingRequirementDelete] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CurriculumRequirementFormValues>({
    resolver: zodResolver(curriculumRequirementSchema),
    defaultValues: {
      minCredits: requirement?.minCredits,
      minCourses: requirement?.minCourses ?? undefined,
    },
  });

  async function handleDeleteCategory() {
    setBusy(true);
    setServerError(null);
    try {
      await deleteCourseCategory(category.id);
      onChanged();
    } catch (error) {
      setConfirmingCategoryDelete(false);
      if (isAxiosError(error) && error.response?.status === 409) {
        setServerError('ลบไม่ได้ เพราะยังมีวิชาอยู่ในหมวดนี้');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteRequirement() {
    if (!requirement) return;
    setBusy(true);
    setServerError(null);
    try {
      await deleteCurriculumRequirement(requirement.id);
      onChanged();
    } catch {
      setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setConfirmingRequirementDelete(false);
      setBusy(false);
    }
  }

  async function onSubmitRequirement(values: CurriculumRequirementFormValues) {
    setServerError(null);
    try {
      if (requirement) {
        await updateCurriculumRequirement(requirement.id, values);
        setEditingRequirement(false);
      } else {
        await createCurriculumRequirement({
          curriculumId: category.curriculumId,
          categoryId: category.id,
          ...values,
        });
      }
      onChanged();
    } catch {
      setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  }

  return (
    <Card
      className={cn(
        'cursor-pointer transition',
        isSelected && 'ring-2 ring-brand',
      )}
      onClick={onSelect}
    >
      <CardHeader
        className="flex-row items-center justify-between space-y-0"
        onClick={(e) => e.stopPropagation()}
      >
        <CardTitle className="text-base">
          {category.name}
          {category.code && <span className="ml-2 text-sm text-muted-foreground">({category.code})</span>}
        </CardTitle>
        {confirmingCategoryDelete ? (
          <div className="flex gap-2">
            <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={handleDeleteCategory}>
              ยืนยันลบ
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmingCategoryDelete(false)}>
              ยกเลิก
            </Button>
          </div>
        ) : (
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingCategoryDelete(true)}>
            ลบหมวดวิชา
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3" onClick={(e) => e.stopPropagation()}>
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {requirement && !editingRequirement ? (
          <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
            <span>
              ต้องการอย่างน้อย {requirement.minCredits} หน่วยกิต
              {requirement.minCourses != null && ` (${requirement.minCourses} วิชา)`}
            </span>
            {confirmingRequirementDelete ? (
              <div className="flex gap-2">
                <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={handleDeleteRequirement}>
                  ยืนยัน
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setConfirmingRequirementDelete(false)}>
                  ยกเลิก
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditingRequirement(true)}>
                  แก้ไข
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingRequirementDelete(true)}>
                  ลบ
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitRequirement)} className="flex items-end gap-3">
              <FormField
                control={form.control}
                name="minCredits"
                render={({ field }) => (
                  <FormItem className="w-32">
                    <FormLabel>หน่วยกิตขั้นต่ำ</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minCourses"
                render={({ field }) => (
                  <FormItem className="w-32">
                    <FormLabel>จำนวนวิชาขั้นต่ำ</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="outline" size="sm" disabled={form.formState.isSubmitting}>
                บันทึก
              </Button>
              {editingRequirement && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditingRequirement(false)}>
                  ยกเลิก
                </Button>
              )}
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
