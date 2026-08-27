'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import type { CreateUserRequest, CreateUserResponse, Role } from '@eduanalyze-ai/shared-types';
import { createUser } from '@/lib/api/user-management';
import {
  createUserSchema,
  type CreateUserFormValues,
} from '@/lib/validation/create-user.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScopeSelector } from './scope-selector';

const CREATABLE_ROLES: { value: Role; label: string }[] = [
  { value: 'INSTRUCTOR', label: 'อาจารย์ (INSTRUCTOR)' },
  { value: 'STAFF', label: 'เจ้าหน้าที่ (STAFF)' },
  { value: 'ADMIN', label: 'ผู้ดูแลระบบ (ADMIN)' },
  { value: 'SUPER_ADMIN', label: 'ผู้ดูแลระบบสูงสุด (SUPER_ADMIN)' },
];

// ADMIN can only ever create STAFF (backend-enforced) — the role field
// still exists in form state for zod to validate, it's just never shown
// as a choice, so an ADMIN can never even attempt (and get 403'd by) a
// different role.
export function CreateUserForm({
  requesterIsSuperAdmin,
  onCreated,
}: {
  requesterIsSuperAdmin: boolean;
  onCreated: (result: CreateUserResponse) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      fullName: '',
      role: requesterIsSuperAdmin ? undefined : 'STAFF',
      scopeLevel: undefined,
      scopeTargetId: '',
    },
  });

  const role = form.watch('role');
  const scopeVisible = role === 'STAFF' || role === 'ADMIN';

  // Scope fields become stale/irrelevant the moment role changes away
  // from STAFF/ADMIN — clear them so a previously-picked scope can't be
  // silently submitted under a role it no longer applies to.
  useEffect(() => {
    if (!scopeVisible) {
      form.resetField('scopeLevel', { defaultValue: undefined });
      form.resetField('scopeTargetId', { defaultValue: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeVisible]);

  async function onSubmit(values: CreateUserFormValues) {
    setServerError(null);
    const payload: CreateUserRequest = {
      email: values.email,
      fullName: values.fullName,
      role: values.role,
      scope:
        values.scopeLevel && values.scopeTargetId
          ? { level: values.scopeLevel, targetId: values.scopeTargetId }
          : undefined,
    };
    try {
      const result = await createUser(payload);
      onCreated(result);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setServerError('อีเมลนี้ถูกใช้งานแล้ว');
      } else if (isAxiosError(error) && error.response?.status === 403) {
        setServerError('คุณไม่มีสิทธิ์สร้างบัญชีนี้ (นอกขอบเขตความรับผิดชอบของคุณ)');
      } else {
        setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">เพิ่มผู้ใช้งาน</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อ-นามสกุล</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {requesterIsSuperAdmin ? (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="w-64">
                    <FormLabel>บทบาท</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกบทบาท" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CREATABLE_ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                สร้างบัญชี: <span className="font-medium text-primary">เจ้าหน้าที่ (STAFF)</span>
              </p>
            )}

            {scopeVisible && <ScopeSelector levelFieldName="scopeLevel" targetFieldName="scopeTargetId" />}

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'กำลังสร้าง...' : 'สร้างผู้ใช้งาน'}
            </Button>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
