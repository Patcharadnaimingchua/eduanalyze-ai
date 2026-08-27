'use client';

import Link from 'next/link';
import type { AdminUserSummary, Role } from '@eduanalyze-ai/shared-types';
import { ROLE_LABEL_TH } from '@/components/auth/require-role';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ROLE_BADGE_TONE: Record<Role, BadgeTone> = {
  STUDENT: 'gray',
  INSTRUCTOR: 'green',
  STAFF: 'gray',
  ADMIN: 'amber',
  SUPER_ADMIN: 'red',
};

export function UserListTable({ users }: { users: AdminUserSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">รายชื่อผู้ใช้งาน</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-muted-foreground">
                <th className="py-2 pr-4 font-medium">ชื่อ-นามสกุล</th>
                <th className="py-2 pr-4 font-medium">อีเมล</th>
                <th className="py-2 pr-4 font-medium">บทบาท</th>
                <th className="py-2 pr-4 font-medium">สถานะ</th>
                <th className="py-2 pr-0 font-medium" />
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    ยังไม่มีผู้ใช้งานในขอบเขตของคุณ
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-50">
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
                    <Badge tone={user.isActive ? 'green' : 'gray'}>
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
      </CardContent>
    </Card>
  );
}
