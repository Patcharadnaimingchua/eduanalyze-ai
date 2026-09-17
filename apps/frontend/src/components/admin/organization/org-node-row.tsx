'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { OrgEntityFormValues } from '@/lib/validation/organization.schema';
import { OrgEntityForm } from './org-entity-form';
import { DeactivateButton } from './deactivate-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function OrgNodeRow({
  item,
  levelLabel,
  childCount,
  childLabel,
  expanded,
  onToggle,
  onUpdate,
  onDeactivate,
  children,
}: {
  item: { id: string; name: string; code: string };
  levelLabel: string;
  childCount: number;
  childLabel: string;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (values: OrgEntityFormValues) => Promise<void>;
  onDeactivate: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-2 px-3 py-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <Chevron size={16} className="shrink-0 text-slate-400" />
          <span className="shrink-0 text-xs text-muted-foreground">{levelLabel}</span>
          <span className="shrink-0 font-mono text-sm text-muted-foreground">{item.code}</span>
          <span className="truncate text-sm font-medium text-primary">{item.name}</span>
          <Badge tone={childCount > 0 ? 'green' : 'gray'}>
            {childCount} {childLabel}
          </Badge>
        </button>
        <div className="flex items-start gap-1">
          {!editing && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
              แก้ไข
            </Button>
          )}
          <DeactivateButton
            blockedReason={
              childCount > 0 ? `ยังมี ${childCount} ${childLabel}ที่ใช้งานอยู่` : undefined
            }
            conflictMessage={`ปิดใช้งานไม่ได้ เพราะยังมี${childLabel}ที่ใช้งานอยู่`}
            onConfirm={onDeactivate}
          />
        </div>
      </div>

      {editing && (
        <div className="px-3 pb-3">
          <OrgEntityForm
            defaultValues={{ name: item.name, code: item.code }}
            submitLabel="บันทึก"
            onSubmit={async (values) => {
              await onUpdate(values);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      {expanded && <div className="space-y-2 border-t border-slate-100 py-3 pl-8 pr-3">{children}</div>}
    </div>
  );
}

export function AddOrgEntity({
  label,
  onCreate,
}: {
  label: string;
  onCreate: (values: OrgEntityFormValues) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        + {label}
      </Button>
    );
  }
  return (
    <OrgEntityForm
      submitLabel={label}
      onSubmit={async (values) => {
        await onCreate(values);
        setOpen(false);
      }}
      onCancel={() => setOpen(false)}
    />
  );
}
