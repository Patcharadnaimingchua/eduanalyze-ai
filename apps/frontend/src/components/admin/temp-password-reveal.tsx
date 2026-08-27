'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Shown exactly once, right after a successful create — there is no
// endpoint to retrieve or regenerate this password later (resend-
// invitation is dead code, see TODO.md), so this deliberately does NOT
// auto-dismiss. The caller only clears/refetches once the admin
// acknowledges via onAcknowledge.
export function TempPasswordReveal({
  fullName,
  email,
  tempPassword,
  onAcknowledge,
}: {
  fullName: string;
  email: string;
  tempPassword: string;
  onAcknowledge: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, insecure context) — the
      // password is still selectable text in the <code> below either way.
    }
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="text-base text-amber-900">
          สร้างบัญชีสำเร็จ — {fullName} ({email})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-medium text-amber-900">รหัสผ่านชั่วคราว</p>
          <div className="flex items-center gap-2">
            <code className="select-all rounded-md border border-amber-200 bg-white px-3 py-2 font-mono text-sm text-primary">
              {tempPassword}
            </code>
            <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check size={14} className="mr-1.5" />
                  คัดลอกแล้ว
                </>
              ) : (
                <>
                  <Copy size={14} className="mr-1.5" />
                  คัดลอก
                </>
              )}
            </Button>
          </div>
        </div>

        <p className="text-sm font-semibold text-amber-900">
          รหัสผ่านนี้จะแสดงเพียงครั้งเดียว ระบบไม่มีวิธีเรียกดูซ้ำ กรุณาคัดลอกและส่งต่อให้ผู้ใช้ตอนนี้
        </p>

        <Button type="button" onClick={onAcknowledge}>
          รับทราบ ปิดหน้าต่างนี้
        </Button>
      </CardContent>
    </Card>
  );
}
