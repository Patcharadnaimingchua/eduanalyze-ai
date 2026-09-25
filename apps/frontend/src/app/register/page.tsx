'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import type { AccessTokenResponse, RegisterRequest } from '@eduanalyze-ai/shared-types';
import { apiClient } from '@/lib/api-client';
import { fetchInvitationPreview } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth-context';
import { registerSchema, type RegisterFormValues } from '@/lib/validation/register.schema';
import {
  invitedRegisterSchema,
  type InvitedRegisterFormValues,
} from '@/lib/validation/invited-register.schema';
import { DependentOrgSelect } from '@/components/auth/dependent-org-select';
import { AuthSplitLayout } from '@/components/auth/auth-split-layout';
import { AuthModeTabs } from '@/components/auth/auth-mode-tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export default function RegisterPage() {
  return (
    // useSearchParams requires a Suspense boundary in the App Router —
    // same pattern as the instructor course page.
    <Suspense fallback={<RegisterFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterFallback() {
  return (
    <AuthSplitLayout>
      <div className="space-y-3">
        <Skeleton className="mx-auto h-6 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </AuthSplitLayout>
  );
}

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get('invitationToken');

  // Only meaningful when an invitationToken is present — enabled:false
  // means uninvited visitors never fire this request at all.
  const invitationQuery = useQuery({
    queryKey: ['invitation-preview', invitationToken],
    queryFn: () => fetchInvitationPreview(invitationToken!),
    enabled: !!invitationToken,
    retry: false,
  });

  if (invitationToken && invitationQuery.isLoading) {
    return (
      <AuthSplitLayout>
        <div className="space-y-3">
          <Skeleton className="mx-auto h-6 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </AuthSplitLayout>
    );
  }

  // Valid invitation: show the short pre-filled form. Missing, expired, or
  // no token at all: fall back to today's fully-manual form — behavior
  // for uninvited self-registration never changes.
  if (invitationToken && invitationQuery.data) {
    return <InvitedRegisterForm token={invitationToken} preview={invitationQuery.data} />;
  }

  return <ManualRegisterForm />;
}

function InvitedRegisterForm({
  token,
  preview,
}: Readonly<{
  token: string;
  preview: {
    email: string;
    fullName: string;
    studentCode: string;
    programCode: string;
    curriculumVersion: string;
    admissionYear: number;
  };
}>) {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<InvitedRegisterFormValues>({
    resolver: zodResolver(invitedRegisterSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
      fullName: preview.fullName,
    },
  });

  async function onSubmit(values: InvitedRegisterFormValues) {
    setServerError(null);
    // studentCode/programId/curriculumId/admissionYear are intentionally
    // omitted — the server always resolves them from invitationToken
    // itself (AuthService.register), never from what this form would send.
    const payload: RegisterRequest = {
      email: preview.email,
      password: values.password,
      fullName: values.fullName,
      invitationToken: token,
    };
    try {
      const { data } = await apiClient.post<AccessTokenResponse>('/auth/register', payload);
      await login(data.accessToken);
      router.push('/dashboard');
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setServerError('อีเมลนี้ถูกใช้งานแล้ว');
      } else if (isAxiosError(error) && error.response?.status === 401) {
        setServerError('คำเชิญนี้หมดอายุหรือถูกใช้ไปแล้ว ติดต่อเจ้าหน้าที่เพื่อขอคำเชิญใหม่');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    }
  }

  return (
    <AuthSplitLayout>
      <h2 className="mb-1 text-center text-xl font-medium">สมัครสมาชิกด้วยคำเชิญ</h2>
      <p className="mb-5 text-center text-sm text-muted-foreground">
        ตั้งรหัสผ่านเพื่อเริ่มใช้งาน ข้อมูลหลักสูตรถูกกรอกไว้ล่วงหน้าโดยเจ้าหน้าที่
      </p>

      <dl className="mb-5 space-y-1 rounded-md border border-slate-100 bg-slate-50 p-3 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">อีเมล</dt>
          <dd className="text-primary">{preview.email}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">รหัสนักศึกษา</dt>
          <dd className="text-primary">{preview.studentCode}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">สาขา / ฉบับหลักสูตร</dt>
          <dd className="text-primary">
            {preview.programCode} / {preview.curriculumVersion}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">ปีเข้าศึกษา</dt>
          <dd className="text-primary">{preview.admissionYear}</dd>
        </div>
      </dl>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <Alert variant="destructive" className="animate-shake">
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

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
          </Button>
        </form>
      </Form>
    </AuthSplitLayout>
  );
}

function ManualRegisterForm() {
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
      const { data } = await apiClient.post<AccessTokenResponse>('/auth/register', payload);
      await login(data.accessToken);
      router.push('/dashboard');
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
            <Alert variant="destructive" className="animate-shake">
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
