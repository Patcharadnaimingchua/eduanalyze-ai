'use client';

import { useEffect, useState } from 'react';
import type { Grade } from '@eduanalyze-ai/shared-types';
import { GRADE_LABELS, GRADE_OPTIONS } from '@/lib/grade-label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// A grade edit saves straight to the record, and the backend stamps the
// editor as the last writer — so a mis-click can't be cleanly undone.
// Picking a value here only stages it; nothing is sent until "บันทึก".
export function GradeSelectConfirm({
  value,
  subject,
  disabled,
  onConfirm,
}: Readonly<{
  value: Grade;
  subject: string;
  disabled?: boolean;
  onConfirm: (grade: Grade) => void;
}>) {
  const [pending, setPending] = useState<Grade | null>(null);

  // The record changed underneath (refetch after a save, edit elsewhere).
  useEffect(() => {
    setPending(null);
  }, [value]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={value}
        onValueChange={(next) => setPending(next === value ? null : (next as Grade))}
        disabled={disabled}
      >
        <SelectTrigger className="w-24 shrink-0" aria-label={`เกรดของ ${subject}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GRADE_OPTIONS.map((g) => (
            <SelectItem key={g} value={g}>
              {GRADE_LABELS[g]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            เปลี่ยน {GRADE_LABELS[value]} → {GRADE_LABELS[pending]}?
          </span>
          <Button
            type="button"
            size="sm"
            disabled={disabled}
            aria-label={`บันทึกเกรด ${GRADE_LABELS[pending]} ให้ ${subject}`}
            onClick={() => {
              const grade = pending;
              setPending(null);
              onConfirm(grade);
            }}
          >
            บันทึก
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => setPending(null)}
          >
            ยกเลิก
          </Button>
        </div>
      )}
    </div>
  );
}
