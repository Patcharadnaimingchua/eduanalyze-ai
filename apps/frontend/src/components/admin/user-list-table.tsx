'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, UserRound } from 'lucide-react';
import type { AdminUserSummary, Role } from '@eduanalyze-ai/shared-types';
import { formatThaiDate } from '@/lib/admin-users';
import { SCOPE_LEVEL_LABELS } from '@/lib/scope-labels';
import { usePagination } from '@/lib/use-pagination';
import { useScopeTargetName } from '@/lib/use-scope-target-name';
import { roleNeedsScope } from '@/lib/user-scope-requirement';
import { useTableSort } from '@/lib/use-table-sort';
import { ROLE_BADGE_TONE, ROLE_LABEL_TH } from '@/components/auth/require-role';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SortHeader } from '@/components/ui/sort-header';
import { UserStatusAction } from '@/components/admin/user-status-action';

const ALL = 'ALL';
const NO_SCOPE = 'NO_SCOPE';
const ACTIVE = 'ACTIVE';
const SUSPENDED = 'SUSPENDED';

// STUDENT never appears here (the list endpoint excludes them).
const FILTERABLE_ROLES = (Object.keys(ROLE_LABEL_TH) as Role[]).filter(
  (role) => role !== 'STUDENT',
);

// The status is always written out; the dot only repeats it.
function StatusChip({ isActive }: Readonly<{ isActive: boolean }>) {
  return (
    <Badge tone={isActive ? 'success' : 'neutral'} className="gap-1.5 whitespace-nowrap">
      <span
        aria-hidden="true"
        className={cn('h-1.5 w-1.5 rounded-full', isActive ? 'bg-emerald-500' : 'bg-slate-400')}
      />
      {isActive ? 'ใช้งานอยู่' : 'ระงับการใช้งาน'}
    </Badge>
  );
}

function UserAvatar() {
  return (
    <span
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand"
    >
      <UserRound size={18} />
    </span>
  );
}

function RoleBadges({ roles }: Readonly<{ roles: Role[] }>) {
  return (
    <>
      {roles.map((role) => (
        <Badge key={role} tone={ROLE_BADGE_TONE[role]}>
          {ROLE_LABEL_TH[role]}
        </Badge>
      ))}
    </>
  );
}

function ScopeBadges({
  user,
  resolveTargetName,
}: Readonly<{
  user: AdminUserSummary;
  resolveTargetName: ReturnType<typeof useScopeTargetName>;
}>) {
  return (
    <>
      {user.scopes.map((scope) => (
        <Badge key={scope.id} tone="neutral" className="whitespace-normal text-left">
          {SCOPE_LEVEL_LABELS[scope.level]}: {resolveTargetName(scope)}
        </Badge>
      ))}
      {user.scopes.length === 0 &&
        (roleNeedsScope(user.roles) ? (
          <Badge tone="warning">ยังไม่กำหนดขอบเขต</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ))}
    </>
  );
}

function DetailLink({
  id,
  className,
  label = 'ดูรายละเอียด',
}: Readonly<{ id: string; className?: string; label?: string }>) {
  return (
    <Link
      href={`/admin/users/${id}`}
      className={cn(buttonVariants({ variant: 'outline' }), 'h-11 gap-1.5', className)}
    >
      {label}
      <ArrowRight size={14} aria-hidden="true" />
    </Link>
  );
}

// A Super Admin edits and suspends from the row; an Admin only opens the detail page.
function RowActions({
  user,
  superAdminId,
  className,
}: Readonly<{ user: AdminUserSummary; superAdminId?: string; className?: string }>) {
  if (!superAdminId) return <DetailLink id={user.id} className={className} />;
  const isPeer = user.roles.includes('SUPER_ADMIN') && user.id !== superAdminId;
  return (
    <div className={cn('flex flex-wrap items-start gap-2 md:justify-end', className)}>
      {!isPeer && <DetailLink id={user.id} label="แก้ไข" />}
      <UserStatusAction user={user} requesterId={superAdminId} />
    </div>
  );
}

export function UserListTable({
  users,
  superAdminId,
}: {
  users: AdminUserSummary[];
  // Set only for a Super Admin: turns on editing and suspending from each row.
  superAdminId?: string;
}) {
  const resolveTargetName = useScopeTargetName();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | typeof ALL>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [scopeFilter, setScopeFilter] = useState<string>(ALL);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter(
      (user) =>
        (term === '' ||
          user.fullName.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term)) &&
        (roleFilter === ALL || user.roles.includes(roleFilter)) &&
        (statusFilter === ALL || (statusFilter === ACTIVE ? user.isActive : !user.isActive)) &&
        (scopeFilter === ALL || (roleNeedsScope(user.roles) && user.scopes.length === 0)),
    );
  }, [users, search, roleFilter, statusFilter, scopeFilter]);
  const isFiltered =
    search.trim() !== '' || roleFilter !== ALL || statusFilter !== ALL || scopeFilter !== ALL;

  const sort = useTableSort(filtered, {
    fullName: (u) => u.fullName,
    email: (u) => u.email,
    status: (u) => (u.isActive ? 0 : 1),
    createdAt: (u) => u.createdAt,
  });
  const pagination = usePagination(
    sort.sorted,
    undefined,
    `${sort.sortKey}|${sort.direction}|${search.trim()}|${roleFilter}|${statusFilter}|${scopeFilter}`,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>รายชื่อผู้ใช้งาน</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Input
            placeholder="ค้นหาชื่อหรืออีเมล..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 sm:max-w-xs"
          />
          <Select
            value={roleFilter}
            onValueChange={(value) => setRoleFilter(value as Role | typeof ALL)}
          >
            <SelectTrigger className="min-h-11 w-full sm:w-44" aria-label="กรองตามบทบาท">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem className="min-h-11" value={ALL}>
                ทุกบทบาท
              </SelectItem>
              {FILTERABLE_ROLES.map((role) => (
                <SelectItem key={role} value={role} className="min-h-11">
                  {ROLE_LABEL_TH[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="min-h-11 w-full sm:w-40" aria-label="กรองตามสถานะ">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem className="min-h-11" value={ALL}>
                ทุกสถานะ
              </SelectItem>
              <SelectItem className="min-h-11" value={ACTIVE}>
                ใช้งานอยู่
              </SelectItem>
              <SelectItem className="min-h-11" value={SUSPENDED}>
                ระงับการใช้งาน
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={scopeFilter} onValueChange={setScopeFilter}>
            <SelectTrigger className="min-h-11 w-full sm:w-52" aria-label="กรองตามขอบเขต">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem className="min-h-11" value={ALL}>
                ขอบเขตทั้งหมด
              </SelectItem>
              <SelectItem className="min-h-11" value={NO_SCOPE}>
                ยังไม่กำหนดขอบเขต
              </SelectItem>
            </SelectContent>
          </Select>
          {isFiltered && (
            <span className="text-sm text-muted-foreground">
              แสดง {filtered.length} จาก {users.length} คน
            </span>
          )}
        </div>
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">
            {users.length === 0
              ? 'ยังไม่มีผู้ใช้งานในขอบเขตของคุณ กด “เพิ่มผู้ใช้งาน” ที่มุมบนเพื่อสร้างบัญชีแรก'
              : 'ไม่พบผู้ใช้งานที่ตรงกับตัวกรอง ลองเปลี่ยนหรือล้างตัวกรองด้านบน'}
          </p>
        ) : (
          <>
            {/* Phone: one card per person, so the page never scrolls sideways. */}
            <ul className="space-y-3 md:hidden">
              {pagination.pageRows.map((user) => (
                <li key={user.id} className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <UserAvatar />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="break-words font-semibold text-primary">{user.fullName}</p>
                      <p className="break-all text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <StatusChip isActive={user.isActive} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <RoleBadges roles={user.roles} />
                    <ScopeBadges user={user} resolveTargetName={resolveTargetName} />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    สร้างเมื่อ {formatThaiDate(user.createdAt)}
                  </p>
                  <RowActions user={user} superAdminId={superAdminId} className="mt-3" />
                </li>
              ))}
            </ul>

            <div className="hidden md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-muted-foreground dark:bg-slate-900/40">
                    <SortHeader {...sort.sortProps('fullName')} className="px-3 py-3">
                      ชื่อ-นามสกุล
                    </SortHeader>
                    <SortHeader {...sort.sortProps('email')} className="px-3 py-3">
                      อีเมล
                    </SortHeader>
                    <th className="px-3 py-3 font-medium">บทบาท</th>
                    <th className="px-3 py-3 font-medium">ขอบเขต</th>
                    <SortHeader {...sort.sortProps('status')} className="px-3 py-3">
                      สถานะ
                    </SortHeader>
                    <SortHeader {...sort.sortProps('createdAt')} className="px-3 py-3">
                      วันที่สร้าง
                    </SortHeader>
                    <th className="px-3 py-3">
                      <span className="sr-only">การดำเนินการ</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.pageRows.map((user) => (
                    <tr
                      key={user.id}
                      className="min-h-[52px] border-b align-top hover:bg-slate-50 dark:hover:bg-slate-900/40"
                    >
                      <td className="px-3 py-3">
                        <span className="flex items-start gap-3">
                          <UserAvatar />
                          <span className="break-words font-medium text-primary">
                            {user.fullName}
                          </span>
                        </span>
                      </td>
                      <td className="break-all px-3 py-3 text-muted-foreground">{user.email}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <RoleBadges roles={user.roles} />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <ScopeBadges user={user} resolveTargetName={resolveTargetName} />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <StatusChip isActive={user.isActive} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 tabular-nums text-muted-foreground">
                        {formatThaiDate(user.createdAt)}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <RowActions user={user} superAdminId={superAdminId} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <Pagination {...pagination} touch onPageChange={pagination.setPage} />
      </CardContent>
    </Card>
  );
}
