'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { AdminUserSummary, Role } from '@eduanalyze-ai/shared-types';
import { SCOPE_LEVEL_LABELS } from '@/lib/scope-labels';
import { usePagination } from '@/lib/use-pagination';
import { useScopeTargetName } from '@/lib/use-scope-target-name';
import { roleNeedsScope } from '@/lib/user-scope-requirement';
import { useTableSort } from '@/lib/use-table-sort';
import { ROLE_BADGE_TONE, ROLE_LABEL_TH } from '@/components/auth/require-role';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortHeader } from '@/components/ui/sort-header';

const ALL = 'ALL';
const NO_SCOPE = 'NO_SCOPE';
const ACTIVE = 'ACTIVE';
const SUSPENDED = 'SUSPENDED';

// STUDENT never appears here (the list endpoint excludes them).
const FILTERABLE_ROLES = (Object.keys(ROLE_LABEL_TH) as Role[]).filter((role) => role !== 'STUDENT');

export function UserListTable({ users }: { users: AdminUserSummary[] }) {
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
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Input
            placeholder="ค้นหาชื่อหรืออีเมล..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as Role | typeof ALL)}>
            <SelectTrigger className="h-9 w-44" aria-label="กรองตามบทบาท">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>ทุกบทบาท</SelectItem>
              {FILTERABLE_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABEL_TH[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-40" aria-label="กรองตามสถานะ">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>ทุกสถานะ</SelectItem>
              <SelectItem value={ACTIVE}>ใช้งานอยู่</SelectItem>
              <SelectItem value={SUSPENDED}>ระงับการใช้งาน</SelectItem>
            </SelectContent>
          </Select>
          <Select value={scopeFilter} onValueChange={setScopeFilter}>
            <SelectTrigger className="h-9 w-52" aria-label="กรองตามขอบเขต">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>ขอบเขตทั้งหมด</SelectItem>
              <SelectItem value={NO_SCOPE}>ยังไม่กำหนดขอบเขต</SelectItem>
            </SelectContent>
          </Select>
          {isFiltered && (
            <span className="text-sm text-muted-foreground">
              แสดง {filtered.length} จาก {users.length} คน
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-muted-foreground">
                <SortHeader {...sort.sortProps('fullName')}>ชื่อ-นามสกุล</SortHeader>
                <SortHeader {...sort.sortProps('email')}>อีเมล</SortHeader>
                <th className="py-2 pr-4 font-medium">บทบาท</th>
                <th className="py-2 pr-4 font-medium">ขอบเขต</th>
                <SortHeader {...sort.sortProps('status')}>สถานะ</SortHeader>
                <th className="py-2 pr-0 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    {users.length === 0
                      ? 'ยังไม่มีผู้ใช้งานในขอบเขตของคุณ กด “เพิ่มผู้ใช้งาน” ที่มุมบนเพื่อสร้างบัญชีแรก'
                      : 'ไม่พบผู้ใช้งานที่ตรงกับตัวกรอง ลองเปลี่ยนหรือล้างตัวกรองด้านบน'}
                  </td>
                </tr>
              )}
              {pagination.pageRows.map((user) => (
                <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 pr-4 text-primary">{user.fullName}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{user.email}</td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-1.5">
                      {user.roles.map((role) => (
                        <Badge key={role} tone={ROLE_BADGE_TONE[role]}>
                          {ROLE_LABEL_TH[role]}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-1.5">
                      {user.scopes.map((scope) => (
                        <Badge key={scope.id} tone="neutral">
                          {SCOPE_LEVEL_LABELS[scope.level]}: {resolveTargetName(scope)}
                        </Badge>
                      ))}
                      {user.scopes.length === 0 &&
                        (roleNeedsScope(user.roles) ? (
                          <Badge tone="warning">ยังไม่กำหนดขอบเขต</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        ))}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={user.isActive ? 'success' : 'neutral'}>
                      {user.isActive ? 'ใช้งานอยู่' : 'ระงับการใช้งาน'}
                    </Badge>
                  </td>
                  <td className="py-3 pr-0 text-right">
                    <Link href={`/admin/users/${user.id}`} className="text-sm font-medium text-brand hover:underline">
                      จัดการ
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination {...pagination} onPageChange={pagination.setPage} />
      </CardContent>
    </Card>
  );
}
