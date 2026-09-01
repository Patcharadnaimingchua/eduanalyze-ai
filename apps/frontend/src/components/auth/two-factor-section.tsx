'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ShieldCheck } from 'lucide-react';
import { disableTwoFactor, enableTwoFactor, setupTwoFactor } from '@/lib/api/two-factor';
import {
  twoFactorDisableSchema,
  twoFactorEnableSchema,
  type TwoFactorDisableFormValues,
  type TwoFactorEnableFormValues,
} from '@/lib/validation/two-factor.schema';
import { useAuth } from '@/lib/auth-context';
import { Badge } from '@/components/ui/badge';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Same Card + react-hook-form + zod + apiClient pattern as
// ChangePasswordForm — the closest existing analog. No Dialog primitive
// exists anywhere in this project, so every step here is an inline
// section swap within one Card rather than a modal.
type Mode = 'view' | 'setup' | 'recoveryCodes' | 'disable';

export function TwoFactorSection() {
  const { user, refreshUser } = useAuth();
  const [mode, setMode] = useState<Mode>('view');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const enabled = !!user?.twoFactorEnabled;

  async function handleDone() {
    setMode('view');
    setRecoveryCodes([]);
    await refreshUser();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">ยืนยันตัวตนสองขั้นตอน (2FA)</CardTitle>
            <CardDescription>ใช้แอป Authenticator (เช่น Google Authenticator, Authy) เพิ่มความปลอดภัยตอนเข้าสู่ระบบ</CardDescription>
          </div>
          {mode === 'view' && (
            <Badge tone={enabled ? 'green' : 'gray'}>{enabled ? 'เปิดอยู่' : 'ปิดอยู่'}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === 'view' && (
          <div>
            {enabled ? (
              <Button type="button" variant="outline" onClick={() => setMode('disable')}>
                ปิดใช้งาน 2FA
              </Button>
            ) : (
              <Button type="button" onClick={() => setMode('setup')}>
                เปิดใช้งาน 2FA
              </Button>
            )}
          </div>
        )}

        {mode === 'setup' && (
          <TwoFactorSetupFlow
            onCancel={() => setMode('view')}
            onEnabled={(codes) => {
              setRecoveryCodes(codes);
              setMode('recoveryCodes');
            }}
          />
        )}

        {mode === 'recoveryCodes' && (
          <TwoFactorRecoveryCodesReveal recoveryCodes={recoveryCodes} onDone={handleDone} />
        )}

        {mode === 'disable' && (
          <TwoFactorDisableFlow onCancel={() => setMode('view')} onDisabled={handleDone} />
        )}
      </CardContent>
    </Card>
  );
}

function TwoFactorSetupFlow({
  onCancel,
  onEnabled,
}: {
  onCancel: () => void;
  onEnabled: (recoveryCodes: string[]) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const setupQuery = useQuery({ queryKey: ['two-factor-setup'], queryFn: setupTwoFactor });
  const form = useForm<TwoFactorEnableFormValues>({
    resolver: zodResolver(twoFactorEnableSchema),
    defaultValues: { code: '' },
  });

  async function onSubmit(values: TwoFactorEnableFormValues) {
    setServerError(null);
    try {
      const { recoveryCodes } = await enableTwoFactor(values);
      onEnabled(recoveryCodes);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        setServerError('รหัสไม่ถูกต้อง ลองสแกน QR ใหม่หรือกรอกรหัสอีกครั้ง');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    }
  }

  if (setupQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">กำลังสร้างรหัสลับ...</p>;
  }
  if (setupQuery.isError || !setupQuery.data) {
    return <p className="text-sm text-destructive">ไม่สามารถสร้างรหัสลับได้ กรุณาลองใหม่อีกครั้ง</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          1. เปิดแอป Authenticator แล้วสแกน QR ด้านล่าง (หรือกรอกรหัสด้วยตัวเองถ้าสแกนไม่ได้)
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL, not a static asset */}
        <img
          src={setupQuery.data.qrCodeDataUrl}
          alt="QR code สำหรับตั้งค่า 2FA"
          className="h-44 w-44 rounded-md border border-slate-200"
        />
        <p className="break-all rounded-md bg-slate-50 px-3 py-2 font-mono text-xs text-muted-foreground">
          {setupQuery.data.secret}
        </p>
      </div>

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
              <FormItem className="w-40">
                <FormLabel>2. กรอกรหัส 6 หลักจากแอป</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" maxLength={6} placeholder="123456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'กำลังยืนยัน...' : 'ยืนยันและเปิดใช้งาน'}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              ยกเลิก
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function TwoFactorRecoveryCodesReveal({
  recoveryCodes,
  onDone,
}: {
  recoveryCodes: string[];
  onDone: () => void;
}) {
  return (
    <div className="space-y-4">
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription>เปิดใช้งาน 2FA สำเร็จ</AlertDescription>
      </Alert>
      <div>
        <p className="mb-2 text-sm font-semibold text-amber-900">
          รหัสสำรอง (Recovery Codes) — เก็บไว้ในที่ปลอดภัย จะแสดงเพียงครั้งเดียว
        </p>
        <div className="grid grid-cols-2 gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 font-mono text-sm">
          {recoveryCodes.map((code) => (
            <span key={code}>{code}</span>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          ใช้รหัสเหล่านี้แทนแอป Authenticator ได้ครั้งละ 1 รหัส ถ้าทำมือถือหายหรือเข้าแอปไม่ได้
        </p>
      </div>
      <Button type="button" onClick={onDone}>
        รับทราบ เสร็จสิ้น
      </Button>
    </div>
  );
}

function TwoFactorDisableFlow({
  onCancel,
  onDisabled,
}: {
  onCancel: () => void;
  onDisabled: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<TwoFactorDisableFormValues>({
    resolver: zodResolver(twoFactorDisableSchema),
    defaultValues: { password: '' },
  });

  async function onSubmit(values: TwoFactorDisableFormValues) {
    setServerError(null);
    try {
      await disableTwoFactor(values);
      onDisabled();
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        setServerError('รหัสผ่านไม่ถูกต้อง');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="max-w-sm">
              <FormLabel>กรอกรหัสผ่านปัจจุบันเพื่อยืนยัน</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="submit" variant="destructive" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'กำลังปิดใช้งาน...' : 'ยืนยันปิดใช้งาน 2FA'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            ยกเลิก
          </Button>
        </div>
      </form>
    </Form>
  );
}
