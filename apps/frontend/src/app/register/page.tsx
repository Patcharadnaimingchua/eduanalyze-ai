'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import type { AccessTokenResponse, OtpPendingResponse, RegisterRequest } from '@eduanalyze-ai/shared-types';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { registerSchema, type RegisterFormValues } from '@/lib/validation/register.schema';
import { DependentOrgSelect } from '@/components/auth/dependent-org-select';
import { AuthSplitLayout } from '@/components/auth/auth-split-layout';
import { AuthModeTabs } from '@/components/auth/auth-mode-tabs';
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

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      studentCode: '',
      facultyId: '',
      departmentId: '',
      programId: '',
      curriculumId: '',
      admissionYear: undefined,
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    // facultyId/departmentId only drive the dependent select — the
    // backend's RegisterDto doesn't take them (a curriculum's program is
    // already unambiguous once curriculumId is chosen).
    const payload: RegisterRequest = {
      email: values.email,
      password: values.password,
      fullName: values.fullName,
      studentCode: values.studentCode,
      programId: values.programId,
      curriculumId: values.curriculumId,
      admissionYear: values.admissionYear,
    };
    try {
      const { data } = await apiClient.post<AccessTokenResponse | OtpPendingResponse>(
        '/auth/register',
        payload,
      );
      if ('accessToken' in data) {
        // TEMPORARY: backend currently skips OTP after register (see
        // TODO.md) and logs the account in immediately — handled here so
        // the frontend behaves correctly whichever way that flag is set.
        await login(data.accessToken);
        router.push('/dashboard');
      } else {
        router.push(`/verify-otp?email=${encodeURIComponent(values.email)}`);
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setServerError('อีเมลหรือรหัสนิสิต/นักศึกษานี้ถูกใช้งานแล้ว');
      } else if (isAxiosError(error) && error.response?.status === 400) {
        setServerError('ข้อมูลหลักสูตรไม่ถูกต้อง กรุณาเลือกใหม่');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    }
  }

  return (
    <AuthSplitLayout>
      <h2 className="mb-1 text-center text-xl font-medium">สมัครสมาชิก</h2>
      <p className="mb-5 text-center text-sm text-muted-foreground">สำหรับนิสิต/นักศึกษาเท่านั้น</p>

      <AuthModeTabs active="register" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ชื่อ-นามสกุล</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>อีเมล</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>รหัสผ่าน</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ยืนยันรหัสผ่านอีกครั้ง</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
            {form.formState.isSubmitting ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
          </Button>
        </form>
      </Form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">หรือสมัครด้วย</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <a href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}>
        <Button type="button" variant="outline" className="w-full">
          Google
        </Button>
      </a>
    </AuthSplitLayout>
  );
}
