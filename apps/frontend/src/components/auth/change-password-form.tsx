'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import type { ChangePasswordRequest } from '@eduanalyze-ai/shared-types';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/lib/validation/change-password.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
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

// Shared by the forced first-login gate (ProtectedRoute) and the voluntary
// "เปลี่ยนรหัสผ่าน" section on /profile — same PATCH /auth/change-password
// call either way, callers differ only in copy and what happens after
// success (the gate needs nothing extra; a re-render once refreshUser()
// resolves clears it on its own).
export function ChangePasswordForm({
  title = 'เปลี่ยนรหัสผ่าน',
  description,
  onSuccess,
}: {
  title?: string;
  description?: string;
  onSuccess?: () => void;
}) {
  const { refreshUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  async function onSubmit(values: ChangePasswordFormValues) {
    setServerError(null);
    const payload: ChangePasswordRequest = {
      oldPassword: values.oldPassword,
      newPassword: values.newPassword,
    };
    try {
      await apiClient.patch('/auth/change-password', payload);
      form.reset({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
      await refreshUser();
      onSuccess?.();
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        setServerError('รหัสผ่านปัจจุบันไม่ถูกต้อง');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
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
              name="oldPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รหัสผ่านปัจจุบัน</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รหัสผ่านใหม่</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ยืนยันรหัสผ่านใหม่อีกครั้ง</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
            </Button>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
