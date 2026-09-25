'use client';

import { useState } from 'react';
import { isAxiosError } from 'axios';
import { MailX } from 'lucide-react';
import type { StudentInvitationListEntry } from '@eduanalyze-ai/shared-types';
import { resendStudentInvitation } from '@/lib/api/staff';
import { useToast } from '@/lib/toast-context';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function StudentInvitationList({
  invitations,
  onChanged,
}: Readonly<{
  invitations: StudentInvitationListEntry[];
  onChanged: () => void;
}>) {
  const [resendingId, setResendingId] = useState<string | null>(null);
  const toast = useToast();

  async function handleResend(id: string, email: string) {
    setResendingId(id);
    try {
      await resendStudentInvitation(id);
      toast.success(`ส่งคำเชิญให้ ${email} อีกครั้งแล้ว`);
      onChanged();
    } catch (error) {
      toast.error(
        isAxiosError(error) && error.response?.status === 404
          ? 'ไม่พบคำเชิญนี้แล้ว — อาจถูกยกเลิกหรือลงทะเบียนไปแล้ว'
          : 'ส่งคำเชิญไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
      );
    } finally {
      setResendingId(null);
    }
  }

  if (invitations.length === 0) {
    return <EmptyState icon={MailX} description="ยังไม่มีคำเชิญที่ค้างอยู่" />;
  }

  return (
    <div className="overflow-auto rounded-md border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr className="border-b border-slate-100 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">รหัสนักศึกษา</th>
            <th className="px-3 py-2 font-medium">ชื่อ-นามสกุล</th>
            <th className="px-3 py-2 font-medium">อีเมล</th>
            <th className="px-3 py-2 font-medium">สาขา</th>
            <th className="px-3 py-2 font-medium">หมดอายุ</th>
            <th className="px-3 py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {invitations.map((inv) => (
            <tr key={inv.id} className="border-b border-slate-50">
              <td className="px-3 py-2 text-primary">{inv.studentCode}</td>
              <td className="px-3 py-2 text-muted-foreground">{inv.fullName}</td>
              <td className="px-3 py-2 text-muted-foreground">{inv.email}</td>
              <td className="px-3 py-2 text-muted-foreground">{inv.program.code}</td>
              <td className="px-3 py-2 text-muted-foreground">{formatExpiry(inv.expiresAt)}</td>
              <td className="px-3 py-2 text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={resendingId === inv.id}
                  onClick={() => handleResend(inv.id, inv.email)}
                >
                  {resendingId === inv.id ? 'กำลังส่ง...' : 'ส่งอีกครั้ง'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
