'use client';

import { useRef, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ITEM =
  'flex min-h-11 w-full items-center rounded px-3 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-accent focus-visible:bg-accent';

// One secondary button holding a category's less-used writes. Radix Popover
// gives Esc to close and focus back on the button; arrow keys move between
// the items. The destructive items sit last, under a rule, in red.
export function CategoryMenu({
  categoryName,
  onEditRule,
  onDeleteRule,
  onDeleteCategory,
}: Readonly<{
  categoryName: string;
  onEditRule?: () => void;
  onDeleteRule?: () => void;
  onDeleteCategory: () => void;
}>) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const items = () => [...(listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];

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
          aria-label={`จัดการหมวด ${categoryName}`}
        >
          จัดการหมวด
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
          className="z-50 max-h-[var(--radix-popover-content-available-height)] w-56 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <div ref={listRef} role="menu" aria-label="จัดการหมวด" onKeyDown={onKeyDown}>
            {onEditRule && (
              <button type="button" role="menuitem" className={ITEM} onClick={choose(onEditRule)}>
                แก้ไขเกณฑ์
              </button>
            )}
            {onEditRule && <div role="separator" className="my-1 border-t" />}
            {onDeleteRule && (
              <button
                type="button"
                role="menuitem"
                className={`${ITEM} text-destructive`}
                onClick={choose(onDeleteRule)}
              >
                ลบเกณฑ์
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              className={`${ITEM} text-destructive`}
              onClick={choose(onDeleteCategory)}
            >
              ลบหมวดวิชา
            </button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
