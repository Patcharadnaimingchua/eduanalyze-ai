'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import type { AccessTokenResponse } from '@eduanalyze-ai/shared-types';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { verifyOtpSchema, type VerifyOtpFormValues } from '@/lib/validation/verify-otp.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  );
}

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { code: '' },
  });

  async function onSubmit(values: VerifyOtpFormValues) {
    setServerError(null);
    try {
      const { data } = await apiClient.post<AccessTokenResponse>('/auth/verify-otp', {
        email,
        code: values.code,
      });
      await login(data.accessToken);
      router.push('/dashboard');
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        setServerError('รหัส OTP ไม่ถูกต้อง หมดอายุ หรือถูกใช้ไปแล้ว');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    }
  }

  if (!email) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>
              ไม่พบอีเมล กรุณาเริ่มต้นใหม่จากหน้าเข้าสู่ระบบหรือสมัครสมาชิก
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ยืนยันรหัส OTP</CardTitle>
        <CardDescription>ระบบส่งรหัส 6 หลักไปที่ {email}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
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
                  <FormLabel>รหัส OTP</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="one-time-code"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'กำลังยืนยัน...' : 'ยืนยัน'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
