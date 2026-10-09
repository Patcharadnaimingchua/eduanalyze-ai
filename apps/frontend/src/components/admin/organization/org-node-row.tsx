'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, FolderOpen, type LucideIcon } from 'lucide-react';
import type { OrgEntityFormValues } from '@/lib/validation/organization.schema';
import { OrgEntityForm } from './org-entity-form';
import { OrgNodeMenu } from './org-node-menu';
import { describeOrgWriteError } from './org-errors';
import { ApiErrorAlert } from '@/components/admin/api-error-alert';
import { DeactivateConfirm } from '@/components/admin/deactivate-confirm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export interface AddChildConfig {
  // e.g. "ภาควิชา" — the row builds "เพิ่มภาควิชา" and the empty-state text from it.
  childLabel: string;
  onCreate: (values: OrgEntityFormValues) => Promise<void>;
}

export function OrgNodeRow({
  item,
  icon: Icon,
  levelLabel,
  summary,
  childCount,
  childLabel,
  expanded,
  onToggle,
  onUpdate,
  onDeactivate,
  addChild,
  children,
}: {
  item: { id: string; name: string; code: string };
  icon: LucideIcon;
  levelLabel: string;
  // What sits below, e.g. "8 ภาควิชา · 24 สาขา · 18 หลักสูตร".
  summary: string;
  // Direct children only: decides whether the node can be deactivated.
  childCount: number;
  childLabel: string;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (values: OrgEntityFormValues) => Promise<void>;
  onDeactivate: () => Promise<void>;
  addChild?: AddChildConfig;
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const Chevron = expanded ? ChevronDown : ChevronRight;
  const nodeLabel = `${levelLabel}${item.name}`;

  async function handleDeactivate() {
    setBusy(true);
    setError(null);
    try {
      await onDeactivate();
    } catch (err) {
      setError(describeOrgWriteError(err, `ปิดใช้งานไม่ได้ เพราะยังมี${childLabel}ที่ใช้งานอยู่`));
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  function startAdding() {
    if (!expanded) onToggle();
    setAdding(true);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-background">
      <div className="flex flex-wrap items-start justify-between gap-2 px-3 py-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-h-11 min-w-0 flex-1 items-start gap-3 text-left"
        >
          <Chevron size={18} aria-hidden="true" className="mt-2.5 shrink-0 text-slate-500" />
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand"
          >
            <Icon size={18} />
          </span>
          <span className="min-w-0 space-y-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">{levelLabel}</span>
              <span className="break-words text-sm font-semibold text-primary">{item.name}</span>
              <Badge tone="neutral" className="font-mono">
                {item.code}
              </Badge>
            </span>
            <span className="block text-xs tabular-nums text-muted-foreground">{summary}</span>
          </span>
        </button>
        <OrgNodeMenu
          nodeLabel={nodeLabel}
          onEdit={() => setEditing(true)}
          addLabel={addChild ? `เพิ่ม${addChild.childLabel}` : undefined}
          onAdd={addChild ? startAdding : undefined}
          onDeactivate={() => setConfirming(true)}
          deactivateBlockedReason={
            childCount > 0 ? `ยังมี ${childCount} ${childLabel}ที่ใช้งานอยู่` : undefined
          }
        />
      </div>

      {error && (
        <div className="px-3 pb-3">
          <ApiErrorAlert message={error} />
        </div>
      )}

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

      {expanded && (
        <div className="space-y-2 border-t border-slate-100 py-3 pl-4 pr-3 sm:pl-8">
          {adding && addChild && (
            <OrgEntityForm
              submitLabel={`เพิ่ม${addChild.childLabel}`}
              onSubmit={async (values) => {
                await addChild.onCreate(values);
                setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          )}
          {childCount === 0 && addChild && !adding ? (
            <EmptyState
              icon={FolderOpen}
              description={`ยังไม่มี${addChild.childLabel}ใน${levelLabel}นี้`}
              action={
                <Button type="button" onClick={() => setAdding(true)}>
                  เพิ่ม{addChild.childLabel}แรก
                </Button>
              }
            />
          ) : (
            children
          )}
        </div>
      )}

      <DeactivateConfirm
        open={confirming}
        onOpenChange={setConfirming}
        itemLabel={nodeLabel}
        busy={busy}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
