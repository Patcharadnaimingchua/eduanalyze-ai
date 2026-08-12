'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { fetchOwnStudentProfile } from '@/lib/api/dashboard';
import { fetchCourses } from '@/lib/api/academic-record';
import {
  createAssessment,
  fetchClos,
  fetchOwnAssessment,
  updateAssessment,
} from '@/lib/api/course-assessment';
import {
  courseAssessmentSchema,
  type CourseAssessmentFormValues,
} from '@/lib/validation/course-assessment.schema';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DEFAULT_SCORE = 3;

export default function CourseAssessmentPage({ params }: { params: { courseId: string } }) {
  return (
    <ProtectedRoute>
      <CourseAssessmentContent courseId={params.courseId} />
    </ProtectedRoute>
  );
}

function CourseAssessmentContent({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const isStudent = !!user?.roles.includes('STUDENT');
  const [serverError, setServerError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ['student-profile-me'],
    queryFn: fetchOwnStudentProfile,
    enabled: isStudent,
  });
  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: fetchCourses, enabled: isStudent });
  const closQuery = useQuery({ queryKey: ['clos'], queryFn: fetchClos, enabled: isStudent });
  const assessmentQuery = useQuery({
    queryKey: ['own-assessment', courseId],
    queryFn: () => fetchOwnAssessment(courseId),
    enabled: isStudent,
  });

  const course = coursesQuery.data?.find((c) => c.id === courseId);
  const clos = (closQuery.data ?? []).filter((c) => c.courseId === courseId);
  const existing = assessmentQuery.data;

  const form = useForm<CourseAssessmentFormValues>({
    resolver: zodResolver(courseAssessmentSchema),
    defaultValues: { cloScores: [], comment: '' },
  });
  const { fields, replace } = useFieldArray({ control: form.control, name: 'cloScores' });

  // Populate the (fixed) CLO rows once CLOs + any existing assessment have
  // loaded — not user-addable/removable, so useFieldArray is only used for
  // its stable field keys, replace() seeds it in one shot.
  useEffect(() => {
    if (clos.length === 0) return;
    replace(
      clos.map((clo) => ({
        cloId: clo.id,
        score: existing?.cloScores.find((s) => s.cloId === clo.id)?.score ?? DEFAULT_SCORE,
      })),
    );
    if (existing?.comment) {
      form.setValue('comment', existing.comment);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clos.length, existing]);

  async function onSubmit(values: CourseAssessmentFormValues) {
    setServerError(null);
    try {
      if (existing) {
        await updateAssessment(existing.id, values);
      } else {
        await createAssessment({ courseId, ...values });
      }
      router.push('/academic-record');
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 400) {
        setServerError('ไม่สามารถประเมินวิชานี้ได้ — ตรวจสอบว่าคุณลงเรียนวิชานี้แล้ว');
      } else if (isAxiosError(error) && error.response?.status === 409) {
        setServerError('คุณได้ประเมินวิชานี้ไปแล้ว');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (!isStudent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">หน้านี้สำหรับนักศึกษาเท่านั้น</p>
      </div>
    );
  }

  const isLoading =
    profileQuery.isLoading || coursesQuery.isLoading || closQuery.isLoading || assessmentQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (
    profileQuery.isError ||
    coursesQuery.isError ||
    closQuery.isError ||
    assessmentQuery.isError ||
    !course ||
    !profileQuery.data
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>
      </div>
    );
  }

  if (clos.length === 0) {
    return (
      <DashboardShell studentCode={profileQuery.data.studentCode} fullName={user.fullName}>
        <Alert>
          <AlertDescription>วิชานี้ยังไม่มี CLO ให้ประเมิน</AlertDescription>
        </Alert>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell studentCode={profileQuery.data.studentCode} fullName={user.fullName}>
      <div>
        <h1 className="text-2xl font-semibold text-primary">
          {existing ? 'แก้ไขการประเมินตนเอง' : 'ประเมินตนเองตาม CLO'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {course.code}: {course.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ให้คะแนนตัวเองในแต่ละ CLO (1-5)</CardTitle>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            {fields.map((field, index) => {
              const clo = clos.find((c) => c.id === field.cloId)!;
              const currentScore = form.watch(`cloScores.${index}.score`);
              return (
                <div key={field.id} className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-primary">{clo.code}</p>
                      <p className="text-sm text-muted-foreground">{clo.description}</p>
                    </div>
                    <span className="shrink-0 text-lg font-semibold text-brand">{currentScore}</span>
                  </div>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={currentScore}
                    onValueChange={(score) => form.setValue(`cloScores.${index}.score`, score)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                  </div>
                </div>
              );
            })}

            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">ความคิดเห็นเพิ่มเติม (ถ้ามี)</label>
              <Textarea {...form.register('comment')} placeholder="แสดงความคิดเห็นเกี่ยวกับวิชานี้..." />
            </div>

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? 'กำลังบันทึก...'
                : existing
                  ? 'บันทึกการแก้ไข'
                  : 'บันทึกการประเมิน'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </DashboardShell>
  );
}
