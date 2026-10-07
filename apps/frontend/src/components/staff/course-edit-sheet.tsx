'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import type { CourseCategory, CourseListItem, Prerequisite } from '@eduanalyze-ai/shared-types';
import { createCourse, updateCourse } from '@/lib/api/staff';
import { describeStaffWriteError } from '@/lib/describe-staff-write-error';
import { useToast } from '@/lib/toast-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  courseEditSchema,
  courseToFormValues,
  toCreateBody,
  toUpdateBody,
  type CourseEditValues,
} from './course-edit';
import { PrerequisiteEditor } from './prerequisite-editor';
import { StaffSheet } from './staff-sheet';

export type CourseSheetTarget =
  { kind: 'create'; defaultCategoryId: string | null } | { kind: 'edit'; course: CourseListItem };

const EMPTY: CourseEditValues = {
  code: '',
  name: '',
  nameEn: '',
  credits: undefined as unknown as number,
  description: '',
  isRequired: true,
  categoryId: '',
};

// Add a course, or edit the seven fields PATCH /courses/:id accepts. The
// curriculum is shown and never changed, and there is no way to close or
// delete a course from here.
export function CourseEditSheet({
  target,
  onClose,
  curriculumId,
  curriculumLabel,
  categories,
  coursesInCurriculum,
  prerequisites,
  onChanged,
}: Readonly<{
  target: CourseSheetTarget | null;
  onClose: () => void;
  curriculumId: string;
  curriculumLabel: string;
  categories: CourseCategory[];
  coursesInCurriculum: CourseListItem[];
  prerequisites: Prerequisite[];
  onChanged: () => void;
}>) {
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<CourseEditValues>({
    resolver: zodResolver(courseEditSchema),
    defaultValues: EMPTY,
  });
  const editing = target?.kind === 'edit' ? target.course : null;

  useEffect(() => {
    if (!target) return;
    setServerError(null);
    form.reset(
      target.kind === 'edit'
        ? courseToFormValues(target.course)
        : { ...EMPTY, categoryId: target.defaultCategoryId ?? categories[0]?.id ?? '' },
    );
    // Reset only when a different target is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  // Flow that writes: POST /courses (add) or PATCH /courses/:id (edit)
  async function onSubmit(values: CourseEditValues) {
    setServerError(null);
    try {
      if (editing) {
        await updateCourse(editing.id, toUpdateBody(values));
        toast.success('บันทึกรายวิชาแล้ว');
      } else {
        await createCourse(toCreateBody(curriculumId, values));
        toast.success('เพิ่มรายวิชาแล้ว');
      }
      onChanged();
      onClose();
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setServerError('มีรหัสวิชานี้อยู่ในหลักสูตรนี้แล้ว');
      } else if (isAxiosError(error) && error.response?.status === 400) {
        setServerError('ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบหมวดวิชาและข้อมูลที่กรอก');
      } else {
        setServerError(describeStaffWriteError(error));
      }
    }
  }

  return (
    <StaffSheet
      open={target !== null}
      onOpenChange={(open) => !open && onClose()}
      title={editing ? `แก้ไขรายวิชา ${editing.code}` : 'เพิ่มรายวิชาใหม่'}
      description={`หลักสูตร: ${curriculumLabel}`}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>รหัสวิชา</FormLabel>
                <FormControl>
                  <Input className="h-11" placeholder="CPE101" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ชื่อวิชา (ภาษาไทย)</FormLabel>
                <FormControl>
                  <Input className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nameEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ชื่อวิชา (ภาษาอังกฤษ) ถ้ามี</FormLabel>
                <FormControl>
                  <Input className="h-11" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="credits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>หน่วยกิต</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      className="h-11"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isRequired"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ประเภทวิชา</FormLabel>
                  <Select
                    value={field.value === false ? 'false' : 'true'}
                    onValueChange={(v) => field.onChange(v === 'true')}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true" className="min-h-11">
                        วิชาบังคับ
                      </SelectItem>
                      <SelectItem value="false" className="min-h-11">
                        วิชาเลือก
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>หมวดวิชา</FormLabel>
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-auto min-h-11 text-left">
                      <SelectValue placeholder="เลือกหมวดวิชา" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="min-h-11">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>คำอธิบายรายวิชา (ถ้ามี)</FormLabel>
                <FormControl>
                  <Textarea className="min-h-24" {...field} value={field.value ?? ''} />
                </FormControl>
                {editing && (
                  <p className="text-xs text-muted-foreground">
                    เว้นว่างไว้เพื่อคงคำอธิบายเดิม ระบบจะเปลี่ยนก็ต่อเมื่อพิมพ์ข้อความใหม่
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" className="h-11 px-5" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? 'กำลังบันทึก...'
                : editing
                  ? 'บันทึกการแก้ไข'
                  : 'เพิ่มรายวิชา'}
            </Button>
            <Button type="button" variant="outline" className="h-11 px-5" onClick={onClose}>
              ยกเลิก
            </Button>
          </div>
        </form>
      </Form>

      {editing && (
        <PrerequisiteEditor
          course={editing}
          coursesInCurriculum={coursesInCurriculum}
          prerequisites={prerequisites}
          onChanged={onChanged}
        />
      )}
    </StaffSheet>
  );
}
