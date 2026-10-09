'use client';

import { useRef, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ITEM =
  'flex min-h-11 w-full flex-col items-start justify-center rounded px-3 py-1 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-accent focus-visible:bg-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:hover:bg-transparent';

// "จัดการ" for one organisation node. Same Popover pattern as CategoryMenu:
// Esc closes and returns focus, arrow keys move between items. A disabled
// item stays focusable so the reason under it is read, but does nothing.
export function OrgNodeMenu({
  nodeLabel,
  onEdit,
  addLabel,
  onAdd,
  onDeactivate,
  deactivateBlockedReason,
}: Readonly<{
  nodeLabel: string;
  onEdit: () => void;
  addLabel?: string;
  onAdd?: () => void;
  onDeactivate: () => void;
  deactivateBlockedReason?: string;
}>) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const items = () => [
    ...(listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []),
  ];

  function onKeyDown(event: React.KeyboardEvent) {
    const all = items();
    const at = all.indexOf(document.activeElement as HTMLElement);
    const move = (to: number) => {
      event.preventDefault();
      all[(to + all.length) % all.length]?.focus();
    };
    if (event.key === 'ArrowDown') move(at + 1);
    else if (event.key === 'ArrowUp') move(at < 0 ? all.length - 1 : at - 1);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(all.length - 1);
  }

  const choose = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          className="gap-1.5 px-3"
          aria-haspopup="menu"
          aria-label={`จัดการ ${nodeLabel}`}
        >
          จัดการ
          <ChevronDown aria-hidden="true" className="h-4 w-4" />
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={4}
          collisionPadding={8}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            items()[0]?.focus();
          }}
          className="z-50 max-h-[var(--radix-popover-content-available-height)] w-64 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <div ref={listRef} role="menu" aria-label={`จัดการ ${nodeLabel}`} onKeyDown={onKeyDown}>
            <button type="button" role="menuitem" className={ITEM} onClick={choose(onEdit)}>
              แก้ไข
            </button>
            {addLabel && onAdd && (
              <button type="button" role="menuitem" className={ITEM} onClick={choose(onAdd)}>
                {addLabel}
              </button>
            )}
            <div role="separator" className="my-1 border-t" />
            <button
              type="button"
              role="menuitem"
              aria-disabled={!!deactivateBlockedReason}
              className={`${ITEM} text-destructive`}
              onClick={deactivateBlockedReason ? undefined : choose(onDeactivate)}
            >
              ปิดใช้งาน
              {deactivateBlockedReason && (
                <span className="text-xs font-normal text-muted-foreground">
                  {deactivateBlockedReason}
                </span>
              )}
            </button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
