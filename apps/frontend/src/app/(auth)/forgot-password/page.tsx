'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '@/lib/api-client';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/lib/validation/forgot-password.schema';
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

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    // Backend always returns the same response whether or not the email
    // exists (prevents account enumeration) — so this UI never branches
    // on the result, only on request success vs. network failure.
    await apiClient.post('/auth/forgot-password', values);
    setSubmitted(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ลืมรหัสผ่าน</CardTitle>
        <CardDescription>กรอกอีเมลที่ใช้สมัครสมาชิก</CardDescription>
      </CardHeader>
      {submitted ? (
        <CardContent>
          <Alert>
            <AlertDescription>
              หากมีบัญชีที่ใช้อีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้ว
            </AlertDescription>
          </Alert>
        </CardContent>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
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
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  กลับไปหน้าเข้าสู่ระบบ
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      )}
    </Card>
  );
}
