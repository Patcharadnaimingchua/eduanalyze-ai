'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import type {
  AccessTokenResponse,
  CompleteGoogleRegistrationRequest,
} from '@eduanalyze-ai/shared-types';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import {
  completeGoogleRegistrationSchema,
  type CompleteGoogleRegistrationFormValues,
} from '@/lib/validation/complete-google-registration.schema';
import { AuthHeading } from '@/components/auth/auth-heading';
import { AuthSplitLayout } from '@/components/auth/auth-split-layout';
import { DependentOrgSelect } from '@/components/auth/dependent-org-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const BRAND_COPY = {
  title: 'สมัครสมาชิกให้เสร็จสมบูรณ์',
  description: 'กรอกข้อมูลการศึกษาที่เหลือ เพื่อเริ่มใช้งานระบบด้วยบัญชี Google ของคุณ',
};

export default function CompleteGoogleRegistrationPage() {
  return (
    <Suspense>
      <CompleteGoogleRegistrationForm />
    </Suspense>
  );
}

function CompleteGoogleRegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingToken = searchParams.get('pendingToken') ?? '';
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<CompleteGoogleRegistrationFormValues>({
    resolver: zodResolver(completeGoogleRegistrationSchema),
    defaultValues: {
      studentCode: '',
      facultyId: '',
      departmentId: '',
      programId: '',
      curriculumId: '',
    },
  });

  async function onSubmit(values: CompleteGoogleRegistrationFormValues) {
    setServerError(null);
    const payload: CompleteGoogleRegistrationRequest = {
      pendingToken,
      studentCode: values.studentCode,
      programId: values.programId,
      curriculumId: values.curriculumId,
      admissionYear: values.admissionYear,
    };
    try {
      const { data } = await apiClient.post<AccessTokenResponse>(
        '/auth/google/complete-registration',
        payload,
      );
      await login(data.accessToken);
      router.push('/dashboard');
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        setServerError('เซสชันหมดอายุ กรุณาเริ่มเข้าสู่ระบบด้วย Google ใหม่');
      } else if (isAxiosError(error) && error.response?.status === 409) {
        setServerError('รหัสนิสิต/นักศึกษานี้ถูกใช้งานแล้ว');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    }
  }

  if (!pendingToken) {
    return (
      <AuthSplitLayout {...BRAND_COPY}>
        <AuthHeading title="ข้อมูลนักศึกษา" />
        <Alert variant="destructive">
          <AlertDescription>
            ไม่พบข้อมูลการสมัคร กรุณาเริ่มเข้าสู่ระบบด้วย Google ใหม่
          </AlertDescription>
        </Alert>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout {...BRAND_COPY}>
      <AuthHeading
        title="ข้อมูลนักศึกษา"
        description="กรอกข้อมูลที่เหลือเพื่อสมัครสมาชิกให้เสร็จสมบูรณ์"
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Alert>
            <AlertDescription>
              แบบฟอร์มนี้สำหรับนิสิต/นักศึกษาที่สมัครใช้งานครั้งแรกเท่านั้น หากคุณควรมีบัญชีเจ้าหน้าที่ อาจารย์
              หรือผู้ดูแลระบบ กรุณาติดต่อผู้ดูแลระบบเพื่อขอบัญชีแทนการกรอกแบบฟอร์มนี้
            </AlertDescription>
          </Alert>
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <FormField
            control={form.control}
            name="studentCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>รหัสนิสิต/นักศึกษา</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="admissionYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ปีที่เข้าศึกษา (พ.ศ.)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DependentOrgSelect />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'กำลังบันทึก...' : 'เสร็จสิ้นการสมัคร'}
          </Button>
        </form>
      </Form>
    </AuthSplitLayout>
  );
}
