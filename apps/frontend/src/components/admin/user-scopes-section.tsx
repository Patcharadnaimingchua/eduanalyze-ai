'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UserScope } from '@eduanalyze-ai/shared-types';
import {
  allActiveScopeTargets,
  allowedLevels,
  allowedScopeTargets,
  excludeHeldScopes,
} from '@/lib/admin-scope-options';
import { fetchDepartments, fetchFaculties, fetchPrograms } from '@/lib/api/organization';
import { createUserScope, deleteUserScope } from '@/lib/api/user-management';
import { SCOPE_LEVEL_LABELS } from '@/lib/scope-labels';
import { useScopeTargetName } from '@/lib/use-scope-target-name';
import { scopeSchema, type ScopeFormValues } from '@/lib/validation/scope.schema';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { RevokeButton } from './revoke-button';
import { describeApiError } from '@/lib/describe-api-error';
import { ApiErrorAlert } from '@/components/admin/api-error-alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/lib/toast-context';
import { Form } from '@/components/ui/form';
import { ScopeSelector } from './scope-selector';

export function UserScopesSection({
  userId,
  scopes,
  lockedReason,
  requesterIsSuperAdmin,
  requesterScopes,
  onChanged,
}: {
  userId: string;
  scopes: UserScope[];
  lockedReason: string | null;
  requesterIsSuperAdmin: boolean;
  // The requester's own scopes; null until loaded (not needed for a SUPER_ADMIN).
  requesterScopes: UserScope[] | null;
  onChanged: () => void;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const toast = useToast();

  const resolveTargetName = useScopeTargetName();
  const facultiesQuery = useQuery({ queryKey: ['faculties'], queryFn: fetchFaculties });
  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments });
  const programsQuery = useQuery({ queryKey: ['programs'], queryFn: fetchPrograms });
  // What may be added: units inside the requester's own scope (any, for a
  // SUPER_ADMIN), minus those this user already holds. null while loading.
  const allowed = useMemo(() => {
    if (!facultiesQuery.data || !departmentsQuery.data || !programsQuery.data) return null;
    const org = {
      faculties: facultiesQuery.data,
      departments: departmentsQuery.data,
      programs: programsQuery.data,
    };
    if (!requesterIsSuperAdmin && !requesterScopes) return null;
    const base = requesterIsSuperAdmin
      ? allActiveScopeTargets(org)
      : allowedScopeTargets(requesterScopes ?? [], org);
    return excludeHeldScopes(base, scopes);
  }, [
    facultiesQuery.data,
    departmentsQuery.data,
    programsQuery.data,
    requesterIsSuperAdmin,
    requesterScopes,
    scopes,
  ]);
  // The Admin's own scope itself reaches a single unit, so the lack of a choice is
  // about their rights and not just about what this user already holds.
  const limitedToOneUnit = useMemo(() => {
    if (requesterIsSuperAdmin || !requesterScopes) return false;
    if (!facultiesQuery.data || !departmentsQuery.data || !programsQuery.data) return false;
    const own = allowedScopeTargets(requesterScopes, {
      faculties: facultiesQuery.data,
      departments: departmentsQuery.data,
      programs: programsQuery.data,
    });
    return own.FACULTY.size + own.DEPARTMENT.size + own.PROGRAM.size === 1;
  }, [
    requesterIsSuperAdmin,
    requesterScopes,
    facultiesQuery.data,
    departmentsQuery.data,
    programsQuery.data,
  ]);
  const nothingToAdd = allowed !== null && allowedLevels(allowed).length === 0;

  const confirmingScope = scopes.find((scope) => scope.id === confirmingId) ?? null;

  const form = useForm<ScopeFormValues>({
    resolver: zodResolver(scopeSchema),
    defaultValues: { level: undefined, targetId: '' },
  });

  const pickedLevel = form.watch('level');
  const pickedTarget = form.watch('targetId');

  async function onSubmit(values: ScopeFormValues) {
    setServerError(null);
    try {
      await createUserScope(userId, values);
      toast.success('เพิ่มขอบเขตความรับผิดชอบแล้ว');
      form.reset({ level: undefined, targetId: '' });
      onChanged();
    } catch (error) {
      setServerError(describeApiError(error));
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
    } catch (error) {
      setServerError(describeApiError(error));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ขอบเขตความรับผิดชอบ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {serverError && <ApiErrorAlert message={serverError} />}

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
                ) : (
                  <RevokeButton label="ถอดขอบเขต" onClick={() => setConfirmingId(scope.id)} />
                )}
              </li>
            ))}
          </ul>
        )}

        {!lockedReason &&
          (allowed === null ? (
            <p className="border-t border-border pt-3 text-sm text-muted-foreground">
              กำลังโหลดหน่วยงานที่เพิ่มได้...
            </p>
          ) : nothingToAdd ? (
            <p className="border-t border-border pt-3 text-sm text-muted-foreground">
              ไม่มีหน่วยงานที่เพิ่มเป็นขอบเขตให้ผู้ใช้นี้ได้แล้ว —
              ผู้ใช้ถืออยู่ครบทุกหน่วยในขอบเขตของคุณ หรือคุณไม่มีสิทธิ์มอบขอบเขตเพิ่ม
            </p>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-3 border-t border-border pt-3 md:flex-row md:items-end"
              >
                <div className="flex-1">
                  <ScopeSelector allowed={allowed} limitedToOwnScope={limitedToOneUnit} />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={form.formState.isSubmitting || !pickedLevel || !pickedTarget}
                >
                  เพิ่มขอบเขต
                </Button>
              </form>
            </Form>
          ))}
      </CardContent>
      <ConfirmDialog
        open={confirmingScope !== null}
        onOpenChange={(open) => !open && setConfirmingId(null)}
        title="ถอดขอบเขตความรับผิดชอบ?"
        description={
          confirmingScope
            ? `ผู้ใช้นี้จะไม่เข้าถึงข้อมูลของ${SCOPE_LEVEL_LABELS[confirmingScope.level]}${resolveTargetName(confirmingScope)} ได้อีก`
            : ''
        }
        confirmLabel="ถอดขอบเขต"
        busy={busyId !== null}
        onConfirm={() => confirmingScope && handleRevoke(confirmingScope.id)}
      />
    </Card>
  );
}
