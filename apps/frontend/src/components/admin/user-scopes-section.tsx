'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import type { UserScope } from '@eduanalyze-ai/shared-types';
import { createUserScope, deleteUserScope } from '@/lib/api/user-management';
import { fetchDepartments, fetchFaculties, fetchPrograms } from '@/lib/api/organization';
import { scopeSchema, type ScopeFormValues } from '@/lib/validation/scope.schema';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { ScopeSelector } from './scope-selector';

const LEVEL_LABELS: Record<UserScope['level'], string> = {
  FACULTY: 'คณะ',
  DEPARTMENT: 'ภาควิชา',
  PROGRAM: 'หลักสูตร',
};

export function UserScopesSection({
  userId,
  scopes,
  isSelf,
  onChanged,
}: {
  userId: string;
  scopes: UserScope[];
  isSelf: boolean;
  onChanged: () => void;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // Same query keys as ScopeSelector — shares the cache, no duplicate fetch.
  const facultiesQuery = useQuery({ queryKey: ['faculties'], queryFn: fetchFaculties });
  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments });
  const programsQuery = useQuery({ queryKey: ['programs'], queryFn: fetchPrograms });

  function resolveTargetName(scope: UserScope): string {
    const targetId = scope.facultyId ?? scope.departmentId ?? scope.programId;
    const list =
      scope.level === 'FACULTY'
        ? facultiesQuery.data
        : scope.level === 'DEPARTMENT'
          ? departmentsQuery.data
          : programsQuery.data;
    return list?.find((item) => item.id === targetId)?.name ?? '—';
  }

  const form = useForm<ScopeFormValues>({
    resolver: zodResolver(scopeSchema),
    defaultValues: { level: undefined, targetId: '' },
  });

  async function onSubmit(values: ScopeFormValues) {
    setServerError(null);
    try {
      await createUserScope(userId, values);
      form.reset({ level: undefined, targetId: '' });
      onChanged();
    } catch {
      setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  }

  async function handleRevoke(scopeId: string) {
    setBusyId(scopeId);
    setServerError(null);
    try {
      await deleteUserScope(userId, scopeId);
      setConfirmingId(null);
      onChanged();
    } catch {
      setServerError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ขอบเขตความรับผิดชอบ (Scope)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {scopes.length === 0 ? (
          <p className="text-sm text-muted-foreground">ยังไม่มีขอบเขตความรับผิดชอบ</p>
        ) : (
          <ul className="space-y-2">
            {scopes.map((scope) => (
              <li
                key={scope.id}
                className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
              >
                <span>
                  {LEVEL_LABELS[scope.level]}: {resolveTargetName(scope)}
                </span>
                {isSelf ? (
                  <span className="text-xs text-muted-foreground">ไม่สามารถแก้ไขบัญชีของตัวเองที่นี่</span>
                ) : confirmingId === scope.id ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={busyId === scope.id}
                      onClick={() => handleRevoke(scope.id)}
                    >
                      ยืนยัน
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmingId(null)}
                    >
                      ยกเลิก
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingId(scope.id)}>
                    ลบ
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3"
          >
            <ScopeSelector />
            <Button type="submit" variant="outline" size="sm" disabled={form.formState.isSubmitting}>
              เพิ่มขอบเขต
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
