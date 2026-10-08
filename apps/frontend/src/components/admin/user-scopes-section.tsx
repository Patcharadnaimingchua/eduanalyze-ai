'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UserScope } from '@eduanalyze-ai/shared-types';
import { createUserScope, deleteUserScope } from '@/lib/api/user-management';
import { SCOPE_LEVEL_LABELS } from '@/lib/scope-labels';
import { useScopeTargetName } from '@/lib/use-scope-target-name';
import { scopeSchema, type ScopeFormValues } from '@/lib/validation/scope.schema';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/lib/toast-context';
import { Form } from '@/components/ui/form';
import { ScopeSelector } from './scope-selector';

export function UserScopesSection({
  userId,
  scopes,
  lockedReason,
  onChanged,
}: {
  userId: string;
  scopes: UserScope[];
  lockedReason: string | null;
  onChanged: () => void;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const toast = useToast();

  const resolveTargetName = useScopeTargetName();

  const form = useForm<ScopeFormValues>({
    resolver: zodResolver(scopeSchema),
    defaultValues: { level: undefined, targetId: '' },
  });

  async function onSubmit(values: ScopeFormValues) {
    setServerError(null);
    try {
      await createUserScope(userId, values);
      toast.success('เพิ่มขอบเขตความรับผิดชอบแล้ว');
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
      toast.success('ถอนขอบเขตความรับผิดชอบแล้ว');
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
        <CardTitle>ขอบเขตความรับผิดชอบ (Scope)</CardTitle>
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
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-sm"
              >
                <span>
                  {SCOPE_LEVEL_LABELS[scope.level]}: {resolveTargetName(scope)}
                </span>
                {lockedReason ? (
                  <span className="text-xs text-muted-foreground">{lockedReason}</span>
                ) : confirmingId === scope.id ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      className="min-h-11"
                      disabled={busyId === scope.id}
                      onClick={() => handleRevoke(scope.id)}
                    >
                      ยืนยัน
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11"
                      onClick={() => setConfirmingId(null)}
                    >
                      ยกเลิก
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="ghost" className="min-h-11" onClick={() => setConfirmingId(scope.id)}>
                    ลบ
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {!lockedReason && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-wrap items-end gap-3 border-t border-border pt-3"
          >
            <ScopeSelector />
            <Button type="submit" variant="outline" className="min-h-11" disabled={form.formState.isSubmitting}>
              เพิ่มขอบเขต
            </Button>
          </form>
        </Form>
        )}
      </CardContent>
    </Card>
  );
}
